# Colour Pipelines: Standards, Formats and Tools

Checked 2026-10-18. Use the standard's own text when exact numbers matter; the summaries below are for orientation.

## 1. Display and signal standards

| Standard | What it defines | Key values |
| :--- | :--- | :--- |
| [ITU-R BT.709](https://www.itu.int/rec/R-REC-BT.709) | HDTV primaries, white point, matrix | Same primaries as sRGB, D65 white |
| [ITU-R BT.1886](https://www.itu.int/rec/R-REC-BT.1886) | Reference EOTF for SDR flat-panel displays in studio production | Gamma 2.4 behaviour on a display with deep black |
| sRGB (IEC 61966-2-1) | Computer and web default | BT.709 primaries, piecewise curve close to gamma 2.2, brighter viewing environment |
| [ITU-R BT.2020](https://www.itu.int/rec/R-REC-BT.2020) | UHDTV wide-gamut primaries | Used as the container gamut for HDR |
| [ITU-R BT.2100](https://www.itu.int/rec/R-REC-BT.2100) | HDR: PQ and HLG transfer functions, reference viewing environment | Reference display at least 1,000 cd/m² peak and 0.005 cd/m² or less black; surround about 5 cd/m² D65 ([ICC registry summary](https://registry.color.org/rgb-registry/bt2100)) |
| [ITU-R BT.2408](https://www.itu.int/pub/R-REP-BT.2408) | Operational practice for HDR production | HDR reference white and graphics white at 203 cd/m² (about 58 percent PQ and 75 percent HLG signal) |
| SMPTE ST 2084 | The PQ transfer function | Absolute, up to 10,000 cd/m² |
| SMPTE ST 2086 | Mastering display colour volume metadata | Used with MaxCLL and MaxFALL for HDR10 |
| DCI-P3 and P3-D65 | Digital cinema projection; P3-D65 for HDR mastering and Apple displays (Display P3) | P3 primaries, DCI or D65 white |

HDR formats: HDR10 (PQ with static metadata), [HDR10+](https://hdr10plus.org/) (dynamic metadata), [Dolby Vision](https://www.dolby.com/technologies/dolby-vision/) (dynamic metadata, licensed), and HLG (broadcast, no metadata needed).

## 2. Colour management systems

- [ACES](https://docs.acescentral.com/) (Academy Color Encoding System, from the Academy of Motion Picture Arts and Sciences). Encodings: ACES2065-1 (AP0, archive and interchange), ACEScg (AP1 linear, CGI and compositing), ACEScct and ACEScc (AP1 logarithmic, grading). [ACES 2.0](https://docs.acescentral.com/background/about-aces-2/) was released in April 2025 with new output transforms (rendering for SDR and HDR displays that keeps bright, saturated colours more natural and makes SDR and HDR versions more consistent). Read the ACES 2.0 notes before upgrading a project from ACES 1.x.
- [OpenColorIO](https://opencolorio.org/) (OCIO): open-source colour management configs used by Nuke, Blender, Houdini, Maya, Katana, Unreal, Substance and others. OCIO 2.5 (October 2025) added built-in ACES 2.0 configs; [OCIO 2.6](https://opencolorio.readthedocs.io/en/latest/releases/ocio_2_6.html) (1 October 2026) adds SMPTE ST 2136-1 CLF read and write support, HDR display validation and an Apple Log 2 built-in transform, and is the base for the CY2027 VFX Reference Platform.
- Application colour management: DaVinci Resolve Color Management (DaVinci Wide Gamut and DaVinci Intermediate), Premiere Pro and After Effects colour management, Final Cut Pro wide-gamut and HDR libraries, Baselight's colour spaces.
- Blender: since Blender 4.0 the [AgX view transform replaced Filmic](https://developer.blender.org/docs/release_notes/4.0/color_management/) as the default in new files.

## 3. Camera log and RAW formats

Every camera maker publishes its log curve and gamut, and the input transforms (IDTs) or LUTs for it. Use the maker's published versions for the exact camera and firmware: for example ARRI LogC4 and ARRI Wide Gamut 4 ([ARRI Log C](https://www.arri.com/en/learn-help/learn-help-camera-system/image-science/log-c)), Sony S-Log3 and S-Gamut3 or S-Gamut3.Cine, Canon Log 2 and Canon Log 3, Panasonic V-Log, RED Log3G10 and REDWideGamutRGB, Blackmagic Film Generation 5, Fujifilm F-Log2, Nikon N-Log, DJI D-Log, and Apple Log on iPhone (OCIO 2.6 adds Apple Log 2). RAW formats (ARRIRAW, REDCODE RAW, Blackmagic RAW, ProRes RAW, Canon Cinema RAW Light) are debayered in the grading application with the maker's SDK.

## 4. Exchange formats

| Format | Use |
| :--- | :--- |
| `.cube` 1D and 3D LUTs | Viewing LUTs and technical conversions; supported almost everywhere |
| [Common LUT Format (CLF)](https://github.com/ampas/CLF), SMPTE ST 2136-1 | XML, combines matrices, curves and LUTs at higher precision; supported by OCIO 2.6 |
| ASC CDL (`.cdl`, `.cc`, `.ccc`, or in EDLs and ALEs) | Slope, offset and power per channel plus saturation: a portable primary grade from set to post (American Society of Cinematographers) |
| ICC profiles (version 2 and 4), [International Color Consortium](https://www.color.org/) | Still images, print, operating-system colour management |
| AMF (ACES Metadata File) | Records the ACES transforms applied to a clip |

## 5. Tools

| Category | Tools |
| :--- | :--- |
| Grading | [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) (free and Studio), [FilmLight Baselight](https://www.filmlight.ltd.uk/products/baselight/overview_bl.php), Assimilate Scratch, Premiere Pro Lumetri, Final Cut Pro colour tools, Avid Media Composer colour mode |
| Compositing and VFX | [Nuke](https://www.foundry.com/products/nuke-family/nuke), After Effects, Fusion (in Resolve), Blender |
| Calibration | [Calman](https://www.portrait.com/), [ColourSpace](https://www.lightillusion.com/colourspace.html), DisplayCAL (open source), monitor makers' tools; a colorimeter or spectroradiometer probe |
| Monitoring hardware | Reference monitors from the broadcast makers, video I/O (Blackmagic DeckLink and UltraStudio, AJA), LUT boxes |
| Colour science in code | [colour-science for Python](https://www.colour-science.org/) (BSD-3-Clause), [Color.js](https://colorjs.io/) (0.7.1, MIT) and [culori](https://culorijs.org/) (4.0.2, MIT) for the web, OCIO's Python and C++ APIs |

## 6. Learning

- *[Cinematic Color](https://github.com/jeremyselan/cinematiccolor)* by Jeremy Selan: colour pipelines for film and VFX, free.
- ACES documentation and the ACES Central forum.
- The camera makers' white papers on their log formats and the platforms' HDR delivery specifications.
- CSS colour on the web: [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/).
