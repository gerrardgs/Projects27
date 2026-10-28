# Photo Editing: Tools, Provenance and Disclosure Rules

Checked 2026-10-18. Laws and platform policies change; confirm the current text before relying on it, and ask a lawyer for legal decisions.

## 1. Editing applications

| Category | Tools | Notes |
| :--- | :--- | :--- |
| RAW development and catalogue | Adobe Lightroom Classic and Lightroom, [Capture One](https://www.captureone.com/), DxO PhotoLab, [darktable](https://www.darktable.org/) (open source, 5.6.2 released 2026-10-04), RawTherapee (open source), [digiKam](https://www.digikam.org/) (open-source asset management) | Edits stored as instructions in a catalogue or XMP sidecar |
| Layered editing and retouching | Adobe Photoshop, [Affinity](https://www.affinity.studio/) (Canva; one app for vector, photo and layout, free since 30 October 2025, with Canva's AI features for Canva Premium users), [GIMP](https://www.gimp.org/) (open source; [GIMP 3.0](https://www.gimp.org/news/2025/03/16/gimp-3-0-released/), 16 March 2025, added non-destructive filters), [Krita](https://krita.org/) (open source, painting), [Pixelmator Pro](https://www.pixelmator.com/pro/) (macOS; Apple announced its acquisition of Pixelmator on 1 November 2024), [Photopea](https://www.photopea.com/) (browser, opens PSD) | Keep layered masters |
| Video tools with photo pages | DaVinci Resolve 21 added a Photo page with node-based grading for stills | Useful when stills and video share one look |
| Mobile | Lightroom mobile, Snapseed, VSCO, the phone's own editor | Check the export resolution and metadata settings |
| Command line and code | [sharp](https://sharp.pixelplumbing.com/) (Node.js, Apache-2.0, 0.35.5), [libvips](https://www.libvips.org/), [ImageMagick](https://imagemagick.org/), [ExifTool](https://exiftool.org/) (read, write and remove metadata), [Squoosh](https://squoosh.app/) (browser comparison of encoders) | Process copies, never originals |

## 2. Metadata standards

- **EXIF**: camera, lens, exposure, date, orientation, GPS position, sometimes serial numbers.
- **IPTC Photo Metadata**: creator, copyright, licence, caption, keywords, location shown, and fields for AI-generated content ("digital source type").
- **XMP**: Adobe's extensible format that carries IPTC fields and editing instructions.
- Commands: `exiftool -a -G1 photo.jpg` lists everything; `exiftool -gps:all= -serialnumber= photo.jpg` removes position and serial number; `exiftool -all= photo.jpg` removes all metadata (including the ICC profile, so re-embed one). The template in [../../video-editing-and-post-production/assets/web-media-pipeline/](../../video-editing-and-post-production/assets/web-media-pipeline/) does this during export and keeps an sRGB profile.

## 3. Provenance: Content Credentials (C2PA)

- [C2PA specification 2.4](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html) (April 2026): signed manifests that record the creator, the tools, the edits and whether generative AI was involved; the [C2PA conformance explorer](https://spec.c2pa.org/conformance-explorer/) lists conforming products.
- [Content Credentials](https://contentcredentials.org/) and the public [Verify tool](https://contentcredentials.org/verify).
- Open-source tools from the Content Authenticity Initiative: [c2patool](https://github.com/contentauth/c2patool) (command line, Apache-2.0), [c2pa-rs](https://github.com/contentauth/c2pa-rs) (Rust SDK, MIT and Apache-2.0), [c2pa-js](https://github.com/contentauth/c2pa-js) (`@contentauth/c2pa-web` 0.15.4 for browsers and `@contentauth/c2pa-node` 0.9.10 for Node.js, MIT; the older `c2pa-node` package is no longer the maintained one).
- Capture devices: Google states that the Pixel Camera app on Pixel 10 phones adds Content Credentials to every photo and reached C2PA Assurance Level 2 ([Google, September 2025](https://blog.google/security/pixel-android-trusted-images-c2pa-content-credentials/)).
- Credentials prove what a signer claims, not that an image is true; an image without credentials is not proof of manipulation. Keep signing keys in a secret manager and decide which assertions are public.

## 4. Disclosure and retouching rules

| Jurisdiction or body | Rule | Source |
| :--- | :--- | :--- |
| European Union | AI Act Article 50: providers mark AI-generated output in a machine-readable way; deployers disclose deepfake images, audio and video; applies from 2 August 2026; fines for these duties up to 15 million euros or 3 percent of worldwide annual turnover | [Regulation (EU) 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) |
| France | "Photographie retouchée" on commercial photos of models whose body shape was altered by software; in force since 1 October 2017; fine up to 37,500 euros or 30 percent of the advertising spend | Code de la santé publique article L. 2133-2 and Décret 2017-738 ([CMS summary](https://cms.law/en/fra/legal-updates/la-mention-photographie-retouchee-obligatoire-a-partir-du-1er-octobre-2017)) |
| Norway | Standard label on advertising in which a person's body shape, size or skin has been retouched or manipulated; applies from 1 July 2022, including influencer marketing; enforced by the Consumer Authority (Forbrukertilsynet) | [Prop. 134 L (2020–2021)](https://www.regjeringen.no/no/dokumenter/prop.-134-l-20202021/id2842301/) |
| United Kingdom | Filters and retouching must not exaggerate a cosmetic product's effect, even with a disclaimer | [ASA: beauty filters](https://www.asa.org.uk/news/the-mis-use-of-social-media-beauty-filters-when-advertising-cosmetic-products.html), [CAP guidance on production techniques](https://www.asa.org.uk/advice-online/cosmetics-the-use-of-production-techniques.html) |
| Photojournalism | No adding, removing or moving content; disclose composites and illustrations | [NPPA Code of Ethics](https://nppa.org/resources/code-ethics) and each agency's policy |

Platforms (Meta, YouTube, TikTok and others) require or apply labels for realistic AI-generated or altered media; read their current policy before publishing.
