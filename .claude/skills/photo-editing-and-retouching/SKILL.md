---
name: photo-editing-and-retouching
description: Edit, retouch, composite and export photographs and still images - RAW development, non-destructive workflows, exposure, white balance and tone, local adjustments and masks, colour grading of stills, skin, product and real-estate retouching, compositing, background removal, generative and AI-assisted editing, batch processing, digital asset management and metadata (EXIF, IPTC, XMP, GPS stripping), Content Credentials (C2PA) and provenance, honest retouching and disclosure laws (France, Norway, UK advertising rules, EU AI Act Article 50), and export for web, social and print (sRGB, Display P3, CMYK, AVIF, WebP, JPEG, TIFF). Includes a tested sharp pipeline that exports responsive web images without location data. Use when editing or retouching photos, building a photo workflow, preparing images for a website, removing metadata, labelling AI or retouched images, or choosing photo editing tools.
license: MIT
metadata:
  version: "1.0.0"
---

# Photo Editing and Retouching

Follow [13-visual-assets-and-licensing](../../rules/13-visual-assets-and-licensing.md) for rights, colour management and export, and [14-ux-writing-and-ethics](../../rules/14-ux-writing-and-ethics.md) for honest representation. Colour pipelines are in [color-grading-and-color-management](../color-grading-and-color-management/SKILL.md). Laws, tools and references are in [references/tools-and-provenance.md](references/tools-and-provenance.md). A tested web export pipeline (responsive sizes, AVIF, WebP and JPEG, sRGB, metadata removed) is in [../video-editing-and-post-production/assets/web-media-pipeline/](../video-editing-and-post-production/assets/web-media-pipeline/).

## 1. Brief and rights

- Write down: purpose (editorial, advertising, product, portrait, social, archive), where the image appears, sizes and crops, the brand's look, and how far retouching may go.
- Confirm the rights: who owns the photo, the licence for this use, model releases for recognisable people and property releases where needed. Stock and agency images carry their own restrictions (for example no sensitive uses, no logo use).
- Editorial and news images are documents: follow the publication's policy and a code such as the [NPPA Code of Ethics](https://nppa.org/resources/code-ethics). Adjust exposure, colour and crop for accuracy only; never add, remove or move content.

## 2. Non-destructive workflow

1. **Ingest**: copy cards to two places, rename consistently (date, shoot, sequence), apply copyright and contact metadata (IPTC) on import, and build previews.
2. **Cull and rate**: pick with flags and stars; compare similar frames side by side at 100 percent for focus.
3. **Develop the RAW**: in Lightroom Classic, Lightroom, Capture One, darktable, RawTherapee, DxO PhotoLab, Affinity, or the Photo page added in DaVinci Resolve 21. Start from the camera profile, then lens corrections, white balance, exposure, tone curve, and colour. Edits are instructions stored in the catalogue or sidecar (XMP), so the original stays untouched.
4. **Local adjustments**: masks (AI subject, sky and person masks, brushes, gradients, range masks) for light and colour where it is needed.
5. **Retouch in layers**: move to a layered editor (Photoshop, Affinity, GIMP 3, Krita, Pixelmator Pro, Photopea) for pixel work, with each step on its own layer, adjustment layers instead of direct adjustments, smart objects or linked layers for re-editable filters, and masks instead of erasing. Keep the layered master (PSD, TIFF, `.af` or `.xcf`).
6. **Export** from the master for each use (section 5); never edit an exported JPEG and export it again.
7. **Archive**: RAW originals, the catalogue or sidecars, layered masters and final exports, in two places, one of them off-site.

## 3. Retouching craft

- **Global first**: exposure, white balance and contrast before local work. Calibrate the screen first ([color-grading-and-color-management](../color-grading-and-color-management/SKILL.md) section 2).
- **Clean-up**: dust, sensor spots, stray hairs, distracting background objects (commercial work only), with healing, clone and content-aware or generative tools. Check edges and repeated textures at 100 percent.
- **Skin**: keep texture. Frequency separation and dodge and burn (on neutral grey layers or curves) control tone and blemishes without plastic-looking smoothing. Remove temporary things (a blemish) more freely than permanent features (scars, moles, body shape); ask the subject or the client where the line is.
- **Product**: accurate colour (shoot a colour chart such as a ColorChecker and build a profile), clean edges, consistent backgrounds and shadows across a catalogue, true-to-life proportions. Product images must show the product as it is ([14-ux-writing-and-ethics](../../rules/14-ux-writing-and-ethics.md)); advertising rules forbid exaggerating a product's effect.
- **Compositing**: match perspective, lens, light direction and colour, grain and depth of field; use luminosity and colour matching, and paint shadows that belong. Label composites in editorial contexts.
- **Background removal and selection**: AI subject selection is a start; refine hair and edges, and check the result on light and dark backgrounds.
- **Batch work**: presets and synchronised settings for consistency; actions, scripts or the command line (sharp, libvips, ImageMagick) for repetitive exports, run on copies.

## 4. Honest retouching, AI and disclosure

- **France**: commercial photographs of models whose body shape has been made thinner or thicker by software must carry the label "photographie retouchée" (Code de la santé publique article L. 2133-2, Décret 2017-738, in force since 1 October 2017; fines up to 37,500 euros or 30 percent of the advertising spend).
- **Norway**: since 1 July 2022, advertising in which a person's body shape, size or skin has been retouched or otherwise manipulated must carry a standard label (Marketing Control Act amendment, Prop. 134 L (2020–2021)); this includes paid posts by influencers.
- **United Kingdom**: the Advertising Standards Authority rules that filters and retouching must not exaggerate the effect of a beauty or cosmetic product, even when the post says a filter was used (Skinny Tan ruling, 3 February 2021; CAP guidance on production techniques).
- **European Union**: from 2 August 2026, Article 50 of the AI Act (Regulation (EU) 2024/1689) requires deployers who publish AI-generated or AI-manipulated images, audio or video that resemble real people, places or events (deepfakes) to disclose that, and providers of generative AI systems to mark outputs in a machine-readable way. Artistic, satirical and fictional works have a lighter, non-intrusive disclosure duty.
- **Platforms** have their own labels for AI-generated or altered media (for example Meta, YouTube, TikTok); follow them.
- Never create a realistic altered image of a real person without consent, never alter news or evidence images, and never generate images that copy another artist's identifiable work or another brand's trade dress ([13-visual-assets-and-licensing](../../rules/13-visual-assets-and-licensing.md) section 1).
- When unsure, label it. A short "Image retouched" or "Created with AI" note costs little; misleading people costs trust and may break the law. Laws differ by country and change: confirm with the client's legal adviser.

## 5. Export

| Use | Format and settings |
| :--- | :--- |
| Website and app | AVIF and WebP with JPEG fallback, several widths for `srcset`, sRGB with an embedded profile, metadata removed (use the template) |
| Social media | JPEG or PNG at the platform's current recommended size, sRGB; the platform re-compresses, so export at high quality |
| Print | TIFF or PDF in the printer's CMYK profile (or RGB if the printer asks for it), at least 300 ppi at final size, soft-proofed with the paper profile ([graphic-design-production](../graphic-design-production/SKILL.md)) |
| Archive and hand-off | 16-bit TIFF or the layered master, in a wide-gamut space (ProPhoto RGB or Adobe RGB) with the profile embedded |
| Wide-gamut screens | Display P3 only with a reason and an sRGB fallback; check contrast and appearance in both |

For the web, run `npm ci && npm test` in [the template](../video-editing-and-post-production/assets/web-media-pipeline/), then:

```ts
import { buildSrcset, exportResponsiveImages } from "./image.ts";

const images = await exportResponsiveImages("masters/hero.tif", "public/media", {
  widths: [640, 1280, 1920],
  formats: ["avif", "webp", "jpeg"],
});
const avifSrcset = buildSrcset(images, "avif", "/media/");
```

It applies the EXIF orientation, never upscales, converts to sRGB with an embedded profile, and removes EXIF, GPS position, camera serial number and XMP; the tests prove each property on a generated photo. Use the returned widths and heights for the `width` and `height` attributes, and write the alt text ([10-accessibility](../../rules/10-accessibility.md) section 3).

## 6. Metadata, privacy and provenance

- **Remove** what the audience should not get: GPS position, camera and lens serial numbers, editing history, personal names in XMP. Photos of homes, children and private people need this most. Check with `exiftool -a -G1 file.jpg`.
- **Keep** what protects the work where appropriate: creator, copyright notice and licence (IPTC fields), in the archive and in images delivered to clients or agencies. Social platforms usually strip it anyway.
- **Content Credentials (C2PA)**: an open standard for signed provenance (who made it, with which tool, what was edited, whether AI was used). [C2PA 2.4](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html) (April 2026) is current. Some cameras and phones (for example the Pixel Camera app on Google's Pixel 10, and some Leica and Sony models), Adobe Photoshop and other editing tools can attach them; [Content Credentials Verify](https://contentcredentials.org/verify) inspects them. Add or verify credentials in your own pipeline with the open-source [c2patool](https://github.com/contentauth/c2patool) (Apache-2.0) and [c2pa-rs](https://github.com/contentauth/c2pa-rs) (MIT and Apache-2.0), or the [c2pa-js](https://github.com/contentauth/c2pa-js) packages for the web and Node.js.
- **Removing metadata also removes the C2PA manifest.** If provenance matters (newsrooms, brands, AI disclosure), sign the final web export after resizing with c2patool, keep the signing key in a secret manager (never in the repository), and decide deliberately which assertions are public: a manifest can reveal names, tools and edit history.

## 7. Done when

- [ ] Rights, model and property releases confirmed and recorded
- [ ] Edits non-destructive; layered master and RAW archived in two places
- [ ] Retouching within the brief and honest for the context; labels applied where law or platform policy requires
- [ ] Colour checked on a calibrated screen; print files soft-proofed
- [ ] Web exports in modern formats with correct sizes, sRGB, alt text, and no location or serial metadata; provenance signed where required
