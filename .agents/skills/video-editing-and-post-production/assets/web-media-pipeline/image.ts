// Exports a master photo as responsive web images: several widths, AVIF, WebP and JPEG, in sRGB,
// with all metadata removed (EXIF, GPS location, camera serial numbers, XMP) except an embedded sRGB profile.
// sharp strips metadata by default; this module relies on that and the tests prove it.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

export type ImageFormat = "avif" | "webp" | "jpeg";

export interface ImageExportOptions {
  /** Output widths in CSS pixels times density, for example [640, 1280, 1920]. Never upscaled. */
  readonly widths: readonly number[];
  readonly formats: readonly ImageFormat[];
  /** 1 to 100. The same perceived quality needs a lower number in AVIF than in JPEG. */
  readonly quality?: Readonly<Partial<Record<ImageFormat, number>>>;
}

export interface ExportedImage {
  readonly file: string;
  readonly format: ImageFormat;
  readonly width: number;
  readonly height: number;
}

const DEFAULT_QUALITY: Readonly<Record<ImageFormat, number>> = { avif: 50, webp: 75, jpeg: 80 };
const EXTENSIONS: Readonly<Record<ImageFormat, string>> = { avif: "avif", webp: "webp", jpeg: "jpg" };

const isIntegerInRange = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max;

function validate(options: ImageExportOptions): void {
  if (options.widths.length === 0 || options.formats.length === 0)
    throw new Error("need at least one width and one format");
  const badWidth = options.widths.find((width) => !isIntegerInRange(width, 16, 8192));
  if (badWidth !== undefined) throw new Error(`width ${badWidth} must be an integer from 16 to 8192`);
  const badQuality = Object.entries(options.quality ?? {}).find(([, quality]) => !isIntegerInRange(quality, 1, 100));
  if (badQuality !== undefined) throw new Error(`${badQuality[0]} quality must be 1 to 100`);
}

function encoder(image: Sharp, format: ImageFormat, quality: number): Sharp {
  if (format === "avif") return image.avif({ quality });
  if (format === "webp") return image.webp({ quality });
  return image.jpeg({ quality, mozjpeg: true });
}

/** Writes every width and format to `outDir` as `<name>-<width>.<ext>` and returns what was written. */
export async function exportResponsiveImages(
  input: string,
  outDir: string,
  options: ImageExportOptions,
): Promise<ExportedImage[]> {
  validate(options);
  const source = sharp(input, { failOn: "error" });
  const { width: storedWidth, height: storedHeight, orientation } = await source.metadata();
  if (storedWidth === undefined || storedHeight === undefined)
    throw new Error(`${input}: could not read the image size`);
  // EXIF orientations 5 to 8 rotate by 90 degrees, so the displayed width is the stored height.
  const sourceWidth = orientation !== undefined && orientation >= 5 ? storedHeight : storedWidth;
  await mkdir(outDir, { recursive: true });
  const base = path.parse(input).name;
  const widths = [...new Set(options.widths.map((width) => Math.min(width, sourceWidth)))].sort((a, b) => a - b);
  const results: ExportedImage[] = [];
  for (const width of widths) {
    for (const format of options.formats) {
      const file = path.join(outDir, `${base}-${width}.${EXTENSIONS[format]}`);
      // rotate() applies the EXIF orientation before the metadata is dropped.
      const pipeline = sharp(input, { failOn: "error" }).rotate().resize({ width, withoutEnlargement: true });
      const quality = options.quality?.[format] ?? DEFAULT_QUALITY[format];
      const info = await encoder(pipeline.toColourspace("srgb").withIccProfile("srgb"), format, quality).toFile(file);
      results.push({ file, format, width: info.width, height: info.height });
    }
  }
  return results;
}

/** Builds a `srcset` attribute value for one format, for example "photo-640.avif 640w, photo-1280.avif 1280w". */
export function buildSrcset(images: readonly ExportedImage[], format: ImageFormat, urlPrefix = ""): string {
  return images
    .filter((image) => image.format === format)
    .map((image) => `${urlPrefix}${path.basename(image.file)} ${image.width}w`)
    .join(", ");
}
