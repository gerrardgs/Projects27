---
name: color-grading-and-color-management
description: Colour-correct and grade video and stills, and manage colour from camera to screen - scene-referred and display-referred pipelines, camera log and RAW formats, ACES 2.0 and OpenColorIO, DaVinci Wide Gamut and Resolve Color Management, LUTs (.cube, CLF) and ASC CDL, scopes (waveform, parade, vectorscope, histogram), primary and secondary correction, shot matching, skin tones and looks, SDR (Rec. 709, BT.1886, sRGB) and HDR (BT.2100 PQ and HLG, HDR10, Dolby Vision, HLG) deliverables, reference monitors, calibration and viewing environments, and colour on the web (Display P3, HDR video, CSS colour queries). Use when grading footage, building a colour pipeline, choosing a LUT or colour space, matching shots, delivering HDR or SDR versions, calibrating a display, or when colours look different between apps, devices or the browser.
license: MIT
metadata:
  version: "1.0.0"
---

# Colour Grading and Colour Management

Colour management makes the same numbers look the same on every correctly set-up screen; grading makes deliberate creative choices on top of that. Do the first before the second. Standards, formats and tools are in [references/color-pipelines.md](references/color-pipelines.md). Still-image colour for print and screen is also in [13-visual-assets-and-licensing](../../rules/13-visual-assets-and-licensing.md) section 3.

## 1. Choose the pipeline before grading

1. List the sources (camera models and their log or RAW formats, graphics, stock footage, phone footage, CGI) and the deliverables (SDR Rec. 709 for TV and web, HDR PQ or HLG, cinema DCI-P3, social, stills).
2. Choose one managed working space and stay in it:
   - **ACES** (Academy Color Encoding System): ACES2065-1 for interchange and archive, ACEScct for grading, ACEScg for CGI and compositing. ACES 2.0 (released April 2025) replaced the output transforms with a new rendering that handles bright saturated colours and HDR better; projects started in ACES 1.x look different under 2.0, so do not switch versions mid-project.
   - **The application's managed space**: DaVinci Wide Gamut with DaVinci Intermediate in Resolve Color Management, or the colour management in Premiere Pro, Final Cut Pro, Baselight or Nuke.
   - **OpenColorIO** (OCIO) configs to share the same transforms between Nuke, Blender, Houdini, Maya, Unreal and other tools. OCIO 2.5 added built-in ACES 2.0 configs; OCIO 2.6 (October 2026) adds reading and writing of SMPTE ST 2136-1 Common LUT Format files.
3. Transform each source into the working space with its correct input transform (IDT or colour-space transform) from the camera maker's log curve and gamut, not by eye and not with a random "log to Rec. 709" LUT.
4. View through one output transform for the main display; derive the other deliverables from the same grade with their own output transforms and a trim pass.

Scene-referred grading (in a wide working space, before the output transform) keeps highlights and saturated colours intact and makes HDR and SDR versions from one grade. Display-referred grading (directly in Rec. 709) is acceptable for simple, SDR-only work.

## 2. Monitor and room

- Grade on a calibrated reference or grading monitor fed by a video output (for example Blackmagic DeckLink or UltraStudio, AJA), not on the computer's interface display through the operating system's colour management.
- SDR reference: Rec. 709 primaries, D65 white, BT.1886 EOTF (equivalent to gamma 2.4 on a display with a very deep black), 100 cd/m² peak white, in a dim room with a neutral surround. sRGB web content assumes a brighter office viewing environment and a different curve, which is one reason web and TV versions look different.
- HDR reference (BT.2100): PQ or HLG, a monitor that reaches at least 1,000 cd/m² for professional mastering, and a dark, neutral surround of about 5 cd/m². ITU-R BT.2408 places HDR reference ("diffuse") white and graphics white at 203 cd/m².
- Calibrate with a measuring probe and software (Calman, ColourSpace, DisplayCAL or the monitor maker's tool); recheck regularly. Keep the room's light neutral (D65), avoid coloured walls in the field of view, and keep reflections off the screen.
- Check the result on consumer devices as well: a phone at typical brightness, a laptop, a television. They will differ; the grade should hold up.

## 3. Read the scopes, not only the picture

- **Waveform and RGB parade**: exposure, contrast and balance per channel; legal ranges for broadcast.
- **Vectorscope**: saturation and hue; skin tones of every complexion fall near the skin-tone indicator line, so use it to spot casts, not to make everyone the same.
- **Histogram and CIE chromaticity scope**: distribution of levels and whether colours stay inside the target gamut.
- **False colour** and exposure tools: check highlight clipping and exposure on set and in grading.
- Eyes adapt within seconds: rest them, compare against a still reference, and use scopes to confirm what you think you see.

## 4. Correct, then grade

1. **Technical normalisation**: input transforms, then exposure, white balance and contrast so the shots in a scene sit together.
2. **Balance and match**: match every shot in a scene to a hero shot (side by side or split screen, with scopes); match skin first.
3. **Secondary corrections**: qualifiers (hue, saturation, luminance keys), shapes or power windows with tracking, and masks for specific areas (sky, skin, product colour). Brand and product colours are checked against the brand's reference, not by memory.
4. **Look**: the creative grade (contrast curve, colour separation, film emulation, grain, halation, vignettes), built once in a node or layer group and applied consistently. Keep it subtle enough that skin and brand colours stay believable.
5. **Trims and deliverables**: the HDR master first when HDR is a deliverable, then an SDR trim (or the reverse when SDR is the primary), each checked on its own reference display.

Node and layer order matters: transforms in a fixed position, corrections before the look, noise reduction early, grain and sharpening last.

## 5. LUTs, CDLs and looks

- LUTs are fixed transforms with limited precision: use them for viewing and for technical conversions published by the camera maker, not as a substitute for colour management. Know each LUT's expected input and output space before applying it; most problems come from a LUT applied to the wrong input.
- Formats: `.cube` (widest support), Common LUT Format (CLF, SMPTE ST 2136-1, XML, can combine operations), and ASC CDL (slope, offset, power, saturation; a small, exact, portable primary grade for on-set to post hand-off).
- Third-party look packs and film emulations are licensed products; check the licence before using them in commercial work.

## 6. HDR deliverables

- **PQ** (SMPTE ST 2084, BT.2100): absolute luminance, up to 10,000 cd/m² in the signal; used by HDR10, HDR10+ and Dolby Vision. Deliver with mastering display metadata (SMPTE ST 2086) and MaxCLL and MaxFALL values, plus dynamic metadata for HDR10+ or Dolby Vision when specified.
- **HLG** (Hybrid Log-Gamma, BT.2100): relative, compatible with SDR displays to a degree; used by broadcasters.
- Encode HDR at 10 bits or more, with the correct colour tags (BT.2020 primaries; PQ or HLG transfer; BT.2020 non-constant-luminance matrix). Untagged or wrongly tagged HDR plays washed out or too dark.
- Platforms each have an HDR specification (for example YouTube's HDR upload article and Netflix's Dolby Vision requirements); follow the current one.

## 7. Colour on the web and in apps

- Tag every export: the colour primaries, transfer and matrix in video (the template in [video-editing-and-post-production](../video-editing-and-post-production/SKILL.md) sets BT.709 and verifies it), and an embedded ICC profile in images (sRGB by default; Display P3 only with a reason).
- Browsers and operating systems display BT.709 video differently (for example, macOS and iOS apply a different display curve than many Windows and TV pipelines), so check the web version on Apple and non-Apple devices and accept small differences instead of grading for one browser.
- CSS: `color-gamut` and `dynamic-range` media queries are Baseline widely available (web-features, checked 2026-10-18); `video-dynamic-range` and `dynamic-range-limit` are limited. Use `color(display-p3 …)` or `oklch()` for wide-gamut UI colours with an sRGB fallback, and test contrast in both.
- HDR images and video in web pages need careful testing on each target browser; give SDR fallbacks and do not let HDR highlights overpower interface text.

## 8. Done when

- [ ] Pipeline written down: sources, input transforms, working space, output transforms, and version (ACES or the application's colour management)
- [ ] Graded on a calibrated reference display in a controlled room; checked on consumer devices
- [ ] Shots matched within scenes; skin and brand colours checked against references and on the vectorscope
- [ ] Each deliverable (SDR, HDR, web, stills) checked on its own display with correct tags and metadata
- [ ] LUTs, looks and plug-ins licensed; LUTs used only with their correct input space
- [ ] Grade, project, LUTs and CDLs archived with the masters
