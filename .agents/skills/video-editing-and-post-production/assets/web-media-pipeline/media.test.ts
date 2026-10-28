// Run with: node --test   (needs FFmpeg and ffprobe on PATH for the video tests)
// Every claim the pipeline makes is measured on real files generated here: metadata removal, colour space,
// sizes, codecs, colour tags, faststart, loudness and true peak.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { promisify } from "node:util";
import sharp from "sharp";
import { buildSrcset, exportResponsiveImages } from "./image.ts";
import { assertLocalPath, type EncodedVideo, encodeForWeb, mp4Args, parseLoudnorm } from "./video.ts";

const run = promisify(execFile);
let work = "";

before(async () => {
  work = await mkdtemp(path.join(tmpdir(), "web-media-"));
});
after(() => rm(work, { recursive: true, force: true }));

describe("responsive images", () => {
  let photo = "";
  before(async () => {
    photo = path.join(work, "photo.jpg");
    // A photo straight from a phone: EXIF with a GPS position, a camera serial number and a rotated orientation.
    await sharp({ create: { width: 2400, height: 1600, channels: 3, background: { r: 200, g: 120, b: 60 } } })
      .withExif({
        IFD0: { Make: "ExampleCam", Model: "X1" },
        IFD2: { BodySerialNumber: "SN-123456" },
        IFD3: { GPSLatitudeRef: "N", GPSLatitude: "51/1 30/1 0/1", GPSLongitudeRef: "W", GPSLongitude: "0/1 7/1 0/1" },
      })
      .withMetadata({ orientation: 6 }) // sharp sets orientation here, not through withExif
      .jpeg({ quality: 90 })
      .toFile(photo);
    const original = await sharp(photo).metadata();
    assert.ok(original.exif !== undefined, "the fixture really carries EXIF");
    assert.equal(original.orientation, 6, "the fixture is stored landscape but displayed portrait");
    assert.match(
      (await readFile(photo)).toString("latin1"),
      /SN-123456/,
      "the fixture really carries the serial number",
    );
  });

  test("writes every width and format, never upscaled, honouring EXIF orientation", async () => {
    const images = await exportResponsiveImages(photo, path.join(work, "img"), {
      widths: [640, 1280, 4000],
      formats: ["avif", "webp", "jpeg"],
    });
    assert.deepEqual(
      [...new Set(images.map((image) => image.width))],
      [640, 1280, 1600],
      "4000 is capped at the rotated width of 1600",
    );
    assert.equal(images.length, 9);
    const portrait = images.find((image) => image.width === 1600);
    assert.equal(portrait?.height, 2400, "orientation 6 turned the landscape master into a portrait");
  });

  test("removes EXIF, GPS and XMP, and embeds an sRGB profile", async () => {
    const [image] = await exportResponsiveImages(photo, path.join(work, "img2"), { widths: [640], formats: ["jpeg"] });
    assert.ok(image);
    const metadata = await sharp(image.file).metadata();
    assert.equal(metadata.exif, undefined, "no EXIF (and so no GPS position or serial number)");
    assert.equal(metadata.xmp, undefined);
    assert.equal(metadata.space, "srgb");
    assert.ok(metadata.icc !== undefined, "an sRGB ICC profile is embedded");
    assert.doesNotMatch((await readFile(image.file)).toString("latin1"), /SN-123456|ExampleCam/);
  });

  test("builds srcset strings and rejects invalid options", async () => {
    const srcset = buildSrcset(
      [
        { file: "/x/a-640.avif", format: "avif", width: 640, height: 427 },
        { file: "/x/a-640.jpg", format: "jpeg", width: 640, height: 427 },
        { file: "/x/a-1280.avif", format: "avif", width: 1280, height: 853 },
      ],
      "avif",
      "/media/",
    );
    assert.equal(srcset, "/media/a-640.avif 640w, /media/a-1280.avif 1280w");
    await assert.rejects(exportResponsiveImages(photo, work, { widths: [5], formats: ["jpeg"] }), /16 to 8192/);
    await assert.rejects(
      exportResponsiveImages(photo, work, { widths: [640], formats: ["jpeg"], quality: { jpeg: 0 } }),
      /quality must be 1 to 100/,
    );
  });
});

/** ffprobe as JSON for the first stream of one type; fails the test when the file has no such stream. */
async function probe(file: string, type: "video" | "audio"): Promise<Record<string, string | number>> {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_streams", "-of", "json", file]);
  const streams: Record<string, string | number>[] = JSON.parse(stdout).streams;
  const stream = streams.find((candidate) => candidate.codec_type === type);
  assert.ok(stream, `${file} has a ${type} stream`);
  return stream;
}

/** Integrated loudness and true peak of a file, measured independently with FFmpeg's ebur128 filter. */
async function loudness(file: string) {
  const { stderr } = await run(
    "ffmpeg",
    ["-hide_banner", "-nostdin", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"],
    {
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  const integrated = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
  const truePeak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
  return { integrated, truePeak };
}

/** True when the MP4 "moov" box comes before "mdat", which lets browsers start playback before the download ends. */
async function hasFaststart(file: string): Promise<boolean> {
  const data = await readFile(file);
  let offset = 0;
  while (offset + 8 <= data.length) {
    const size = data.readUInt32BE(offset);
    const type = data.toString("latin1", offset + 4, offset + 8);
    if (type === "moov") return true;
    if (type === "mdat" || size < 8) return false;
    offset += size;
  }
  return false;
}

describe("web video", () => {
  let master = "";
  let encoded: EncodedVideo;
  before(async () => {
    master = path.join(work, "master.mov");
    // A 4-second 1920x1080 test pattern with a quiet tone (about -30 LUFS), standing in for an exported edit.
    await run("ffmpeg", [
      ...["-hide_banner", "-nostdin", "-y", "-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=30:duration=4"],
      ...["-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=4", "-af", "volume=-27dB"],
      ...["-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", master],
    ]);
    encoded = await encodeForWeb(master, path.join(work, "out"), { maxHeight: 720, webm: true });
  });

  test("encodes web-safe H.264 with BT.709 tags and faststart", async () => {
    const video = await probe(encoded.mp4, "video");
    assert.deepEqual(
      [video.codec_name, video.profile, video.pix_fmt, video.width, video.height],
      ["h264", "High", "yuv420p", 1280, 720],
    );
    assert.deepEqual([video.color_space, video.color_primaries, video.color_transfer], ["bt709", "bt709", "bt709"]);
    assert.ok(await hasFaststart(encoded.mp4), "moov before mdat");
  });

  test("normalises the quiet master to -16 LUFS with a true peak of at most -1 dBTP", async () => {
    const audio = await probe(encoded.mp4, "audio");
    assert.deepEqual([audio.codec_name, audio.sample_rate], ["aac", "48000"]);
    assert.ok(Number(encoded.measured.input_i) < -25, `the master was quiet (${encoded.measured.input_i} LUFS)`);
    const measured = await loudness(encoded.mp4);
    assert.ok(
      Math.abs(measured.integrated - -16) <= 1,
      `integrated loudness ${measured.integrated} LUFS is within 1 LU of -16`,
    );
    assert.ok(measured.truePeak <= -1, `true peak ${measured.truePeak} dBFS is at most -1`);
  });

  test("writes an AV1 and Opus WebM and a JPEG poster at the output size", async () => {
    assert.ok(encoded.webm);
    assert.equal((await probe(encoded.webm, "video")).codec_name, "av1");
    assert.equal((await probe(encoded.webm, "audio")).codec_name, "opus");
    const poster = await sharp(encoded.poster).metadata();
    assert.deepEqual([poster.format, poster.width, poster.height], ["jpeg", 1280, 720]);
  });

  test("refuses paths FFmpeg would treat as options or protocols, before running anything", async () => {
    for (const bad of ["-i", "-filter_complex", "concat:a.mp4|b.mp4", "http://example.com/x.mp4", "file:/etc/passwd"]) {
      assert.throws(() => assertLocalPath(bad), /must be a local file path/, bad);
    }
    await assert.rejects(encodeForWeb("-version", work), /must be a local file path/);
    await assert.rejects(encodeForWeb(master, work, { targetLufs: -5 }), /targetLufs/);
  });

  test("parses loudnorm output and rejects silence", () => {
    const sample =
      'noise\n{\n"input_i" : "-30.10",\n"input_tp" : "-25.00",\n"input_lra" : "0.00",\n"input_thresh" : "-40.10",\n"target_offset" : "0.10"\n}\n';
    assert.equal(parseLoudnorm(sample).input_i, "-30.10");
    assert.throws(() => parseLoudnorm(sample.replace('"-30.10"', '"-inf"')), /not finite/);
    assert.throws(() => parseLoudnorm("no json here"), /no measurement/);
    const args = mp4Args(
      "in.mov",
      "out.mp4",
      { targetLufs: -16, truePeakDb: -1.5, crf: 23, maxHeight: 1080, webm: false, posterAt: 1 },
      parseLoudnorm(sample),
    );
    assert.ok(
      args.includes("+faststart") && args.includes("yuv420p") === false && args.join(" ").includes("format=yuv420p"),
    );
  });
});
