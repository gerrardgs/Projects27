---
trigger: model_decision
description: "Apply when creating, editing, exporting, optimising or sourcing visual and media assets: logos, icons, illustrations, photos and retouching, fonts, video, audio, motion graphics, colour grading, social media and print artwork, colour profiles, file formats, metadata and provenance, and the licences, attribution and disclosures they need."
---

# R-13: Visual Assets, Production and Licensing

Applies to graphic design, digital marketing artwork, UI assets, print, photography, video, audio and motion. Procedures and specifications are in [graphic-design-production](../skills/graphic-design-production/SKILL.md), [photo-editing-and-retouching](../skills/photo-editing-and-retouching/SKILL.md), [video-editing-and-post-production](../skills/video-editing-and-post-production/SKILL.md), [color-grading-and-color-management](../skills/color-grading-and-color-management/SKILL.md) and [motion-graphics-and-animation](../skills/motion-graphics-and-animation/SKILL.md).

## 1. Licensing comes first

- Use only assets you have the right to use for the intended purpose (commercial use, modification, redistribution, embedding in apps or the web). Read the licence; do not assume "free to download" means "free to use".
- Fonts: check the licence covers the use (desktop, web embedding, app embedding, logo use, broadcast). Open-licensed fonts (SIL Open Font License, for example most of Google Fonts) allow embedding and commercial use; commercial fonts often need separate web or app licences.
- Images and icons: record the source, author, licence and any required attribution in the project (for example `CREDITS.md` or the asset metadata). Respect model and property releases for photos of people and places.
- Never use logos, trademarks, characters or proprietary artwork of other organisations except as permitted (for example official brand assets used according to their guidelines). Never imitate a real brand in a way that could mislead.
- AI-generated images: follow the tool's terms, the client's policy, and applicable law; disclose AI use where required; do not generate likenesses of real people or copies of living artists' distinctive work without permission.
- Music, sound effects, stock footage and voice recordings are licensed per use (platform, territory, paid advertising, duration). Record the licence with the project; a track licensed for social posts may not cover a paid advertisement or broadcast.

## 2. Source files and organisation

- Keep layered, editable source files (Figma, Penpot, Sketch, Affinity, Photoshop, Illustrator, InDesign) separate from exported deliverables. Name files and layers meaningfully; use components, styles and variables so changes propagate.
- Use a predictable naming scheme for exports, for example `icon-search-24.svg`, `hero-home@2x.webp`, `logo-primary-horizontal-rgb.svg`.
- Large binaries belong in the design tool, an asset manager, or Git LFS, not in regular Git commits ([08-git-workflow](08-git-workflow.md)).

## 3. Colour management

- Screen work: sRGB by default; Display P3 only with an sRGB fallback and a reason. Embed or assign the colour profile when exporting.
- Print work: confirm the printer's specification (colour profile such as a FOGRA or GRACoL/SWOP condition, total ink limit, spot colours) before converting to CMYK. Keep the RGB master; convert as late as possible.
- Brand colours are specified for every medium: HEX/RGB (screen), CMYK (process print), and spot (Pantone) where the brand uses one. Never eyeball a conversion; use the brand guide or a colour-managed conversion.

## 4. Export specifications

| Use | Format | Notes |
| :--- | :--- | :--- |
| Icons, logos, simple illustrations on screen | SVG (optimised with SVGO) | Outline text or embed licensed fonts; remove editor metadata; keep a `viewBox` |
| Photos and complex images on the web | AVIF or WebP, JPEG fallback | Export at 1x and 2x (or use responsive `srcset`), compress, strip EXIF location data |
| Screenshots, UI with flat colour, transparency | PNG or WebP (lossless) | Use lossy WebP/AVIF when quality allows |
| Print | PDF/X (for example PDF/X-4) as requested by the printer | At least 300 ppi at final size for raster images; bleed (commonly 3 mm or 0.125 in) and safe margins as specified; fonts embedded |
| Motion on the web | MP4 (H.264) or WebM, Lottie or Rive for vector animation | Provide a static fallback and respect reduced motion |
| App icons, favicons, social images | As specified by the platform | Check the platform's current official specification; sizes change |

Platform-specific sizes (social media, app stores, ad networks) change often. Look them up in the platform's official documentation on the day and record the date; do not rely on memory.

## 5. Quality checks before delivery

- View at actual size and at 2x; check edges, alignment to the pixel grid for small icons, and text legibility.
- Check accessibility: contrast of text in images, alt text supplied for each image, no text baked into images when live text is possible.
- Check file weight against the page's performance budget ([12-web-performance](12-web-performance.md)).
- Print: request or produce a proof; check bleed, trim, safe area, resolution, colour mode, overprint and fonts with a preflight tool.

## 6. Honest media, provenance and metadata

- Do not alter news, documentary or evidence images and video beyond accurate exposure, colour and crop. Never create a realistic altered image, voice or video of a real person without consent.
- Label retouched and AI-generated media where the law or the platform requires it: the EU AI Act Article 50 disclosure duties for deepfakes and machine-readable marking apply from 2 August 2026; France requires "photographie retouchée" on commercial model photos whose body shape was altered; Norway requires a label on advertising with retouched bodies or skin; UK advertising must not exaggerate a product's effect with filters ([photo-editing-and-retouching](../skills/photo-editing-and-retouching/SKILL.md) section 4).
- Remove location (GPS), serial numbers and editing history from published photos unless they are needed; keep creator and copyright fields where appropriate. Removing metadata also removes Content Credentials (C2PA), so sign the final export again when provenance is required.
- Video and audio: measure loudness against the deliverable's standard (for example EBU R 128, ATSC A/85, AES TD1004 or the platform's specification), tag colour correctly (BT.709 for SDR, BT.2100 for HDR), and test the final render for flashing (WCAG 2.2 SC 2.3.1, Harding or PEAT) before delivery.
