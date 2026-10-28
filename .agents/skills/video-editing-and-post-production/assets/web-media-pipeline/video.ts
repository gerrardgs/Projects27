// Encodes a finished edit (the master) into web delivery files with FFmpeg:
// - MP4: H.264 High profile, yuv420p (plays everywhere), BT.709 colour tags, "faststart" for progressive playback,
//   AAC audio normalised to a target loudness with FFmpeg's two-pass loudnorm filter (EBU R 128 / ITU-R BS.1770).
// - Optional WebM: AV1 (SVT-AV1) with Opus audio, smaller at the same quality where browsers support it.
// - A JPEG poster frame.
// FFmpeg runs through execFile with argument arrays, never a shell, so file names cannot inject commands.
import { execFile } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const TIMEOUT_MS = 10 * 60_000;

export interface VideoOptions {
  /** Integrated loudness target in LUFS. AES TD1004 recommends at most -16 and at least -20 for streaming. */
  readonly targetLufs?: number;
  /** True-peak ceiling in dBTP passed to loudnorm; kept below -1.0 so the encoded result stays under -1.0. */
  readonly truePeakDb?: number;
  /** x264 constant rate factor: lower is better quality and larger files. 18 to 28 is the useful range. */
  readonly crf?: number;
  /** Longest side of the output in pixels; never upscaled. */
  readonly maxHeight?: number;
  readonly webm?: boolean;
  /** Time in seconds for the poster frame. */
  readonly posterAt?: number;
}

export interface LoudnessMeasurement {
  readonly input_i: string;
  readonly input_tp: string;
  readonly input_lra: string;
  readonly input_thresh: string;
  readonly target_offset: string;
}

const DEFAULTS = { targetLufs: -16, truePeakDb: -1.5, crf: 23, maxHeight: 1080, webm: false, posterAt: 1 } as const;

function settings(options: VideoOptions): Required<VideoOptions> {
  const merged = { ...DEFAULTS, ...options };
  const inRange = (value: number, min: number, max: number) => Number.isFinite(value) && value >= min && value <= max;
  if (!inRange(merged.targetLufs, -30, -10)) throw new Error("targetLufs must be between -30 and -10");
  if (!inRange(merged.truePeakDb, -9, 0)) throw new Error("truePeakDb must be between -9 and 0");
  if (!Number.isInteger(merged.crf) || !inRange(merged.crf, 0, 51))
    throw new Error("crf must be an integer from 0 to 51");
  if (!Number.isInteger(merged.maxHeight) || !inRange(merged.maxHeight, 144, 4320))
    throw new Error("maxHeight must be 144 to 4320");
  if (!inRange(merged.posterAt, 0, 86_400)) throw new Error("posterAt must be a time in seconds");
  return merged;
}

/** Rejects paths FFmpeg would read as options or protocols (for example "-i", "concat:", "http://"). */
export function assertLocalPath(file: string): void {
  if (file.startsWith("-") || /^[a-z][a-z0-9+.-]*:/i.test(file)) throw new Error(`"${file}" must be a local file path`);
}

/** First pass: measure loudness. FFmpeg prints the measurement as JSON at the end of standard error. */
export function measureArgs(input: string, target: number, truePeak: number): string[] {
  return [
    "-hide_banner",
    "-nostdin",
    "-i",
    input,
    "-af",
    `loudnorm=I=${target}:TP=${truePeak}:LRA=11:print_format=json`,
    "-f",
    "null",
    "-",
  ];
}

export function parseLoudnorm(stderr: string): LoudnessMeasurement {
  const start = stderr.lastIndexOf("{");
  const end = stderr.lastIndexOf("}");
  if (start === -1 || end < start) throw new Error("loudnorm printed no measurement");
  const parsed: unknown = JSON.parse(stderr.slice(start, end + 1));
  if (typeof parsed !== "object" || parsed === null) throw new Error("loudnorm measurement is not an object");
  const fields = new Map(Object.entries(parsed));
  const field = (key: keyof LoudnessMeasurement): string => {
    const value = fields.get(key);
    // loudnorm prints numbers as strings, including "-inf" for silence, which cannot be normalised.
    if (typeof value !== "string" || !Number.isFinite(Number(value)))
      throw new Error(`loudnorm ${key} is missing or not finite`);
    return value;
  };
  return {
    input_i: field("input_i"),
    input_tp: field("input_tp"),
    input_lra: field("input_lra"),
    input_thresh: field("input_thresh"),
    target_offset: field("target_offset"),
  };
}

function loudnormFilter(target: number, truePeak: number, measured: LoudnessMeasurement): string {
  return [
    `loudnorm=I=${target}:TP=${truePeak}:LRA=11`,
    `measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}`,
    `measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`,
  ].join(":");
}

const scaleFilter = (maxHeight: number) => `scale=-2:'min(${maxHeight},ih)':flags=lanczos`;
// FFmpeg's filter graph carries colour properties on the frames, so they are set here; output flags alone are
// overridden by the frames (verified with FFmpeg 8.1). The output flags below stay for older builds.
const TAG_BT709 = "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv";
const BT709 = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"];

/** Second pass for MP4: H.264 + AAC with the measured loudness applied linearly. */
export function mp4Args(
  input: string,
  output: string,
  options: Required<VideoOptions>,
  measured: LoudnessMeasurement,
): string[] {
  return [
    ...["-hide_banner", "-nostdin", "-y", "-i", input, "-map", "0:v:0", "-map", "0:a:0?"],
    ...["-vf", `${scaleFilter(options.maxHeight)},format=yuv420p,${TAG_BT709}`, "-c:v", "libx264", "-preset", "slow"],
    ...["-crf", String(options.crf), "-profile:v", "high", ...BT709, "-movflags", "+faststart"],
    ...[
      "-af",
      `${loudnormFilter(options.targetLufs, options.truePeakDb, measured)},aresample=48000`,
      "-c:a",
      "aac",
      "-b:a",
      "160k",
    ],
    output,
  ];
}

/** Second pass for WebM: AV1 (SVT-AV1) + Opus. */
export function webmArgs(
  input: string,
  output: string,
  options: Required<VideoOptions>,
  measured: LoudnessMeasurement,
): string[] {
  return [
    ...["-hide_banner", "-nostdin", "-y", "-i", input, "-map", "0:v:0", "-map", "0:a:0?"],
    ...[
      "-vf",
      `${scaleFilter(options.maxHeight)},format=yuv420p,${TAG_BT709}`,
      "-c:v",
      "libsvtav1",
      "-crf",
      "35",
      "-preset",
      "8",
      ...BT709,
    ],
    ...[
      "-af",
      `${loudnormFilter(options.targetLufs, options.truePeakDb, measured)},aresample=48000`,
      "-c:a",
      "libopus",
      "-b:a",
      "128k",
    ],
    output,
  ];
}

export function posterArgs(input: string, output: string, options: Required<VideoOptions>): string[] {
  return [
    "-hide_banner",
    "-nostdin",
    "-y",
    "-ss",
    String(options.posterAt),
    "-i",
    input,
    "-frames:v",
    "1",
    "-vf",
    scaleFilter(options.maxHeight),
    "-q:v",
    "3",
    output,
  ];
}

export interface EncodedVideo {
  readonly mp4: string;
  readonly webm: string | undefined;
  readonly poster: string;
  readonly measured: LoudnessMeasurement;
}

/** Runs both passes and writes `<name>.mp4`, optionally `<name>.webm`, and `<name>-poster.jpg` into `outDir`. */
export async function encodeForWeb(input: string, outDir: string, options: VideoOptions = {}): Promise<EncodedVideo> {
  assertLocalPath(input);
  assertLocalPath(outDir);
  await access(input);
  const resolved = settings(options);
  await mkdir(outDir, { recursive: true });
  const base = path.join(outDir, path.parse(input).name);
  const { stderr } = await run("ffmpeg", measureArgs(input, resolved.targetLufs, resolved.truePeakDb), {
    timeout: TIMEOUT_MS,
    maxBuffer: 64 * 1024 * 1024,
  });
  const measured = parseLoudnorm(stderr);
  const mp4 = `${base}.mp4`;
  await run("ffmpeg", mp4Args(input, mp4, resolved, measured), { timeout: TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 });
  const webm = resolved.webm ? `${base}.webm` : undefined;
  if (webm !== undefined)
    await run("ffmpeg", webmArgs(input, webm, resolved, measured), {
      timeout: TIMEOUT_MS,
      maxBuffer: 64 * 1024 * 1024,
    });
  const poster = `${base}-poster.jpg`;
  await run("ffmpeg", posterArgs(input, poster, resolved), { timeout: TIMEOUT_MS });
  return { mp4, webm, poster, measured };
}
