---
name: video-editing-and-post-production
description: Plan, edit, finish and deliver video - ingest and media management, proxies, story and rhythm editing, sound editing and mixing to loudness standards (EBU R 128, ATSC A/85, AES TD1004, platform targets), captions and subtitles, audio description, titles and graphics, colour hand-off, codecs and containers (ProRes, DNxHR, H.264, HEVC, AV1, VP9), frame rates and timecode, exports for broadcast, streaming, social and the web, adaptive streaming (HLS, DASH), web video players, and browser-side video (WebCodecs, FFmpeg.wasm, Remotion). Includes a tested FFmpeg and sharp pipeline for web video, posters and responsive images. Use when editing or exporting video, choosing codecs or export settings, preparing deliverables for YouTube, social or broadcast, normalising audio loudness, adding captions, or putting video on a website.
license: MIT
metadata:
  version: "1.0.0"
---

# Video Editing and Post-Production

Follow [13-visual-assets-and-licensing](../../rules/13-visual-assets-and-licensing.md) for rights and provenance and [10-accessibility](../../rules/10-accessibility.md) for captions, audio description and flashing. Colour work is in [color-grading-and-color-management](../color-grading-and-color-management/SKILL.md); animated titles and motion graphics are in [motion-graphics-and-animation](../motion-graphics-and-animation/SKILL.md). Standards, codec tables, platform specifications and tools are in [references/delivery-and-standards.md](references/delivery-and-standards.md). A tested web delivery pipeline is in [assets/web-media-pipeline/](assets/web-media-pipeline/).

## 1. Brief and deliverables first

Before cutting, write down: purpose and audience, where it will be watched (cinema, TV, streaming service, YouTube, social feed, website hero, presentation), running time, aspect ratios (16:9, 9:16, 1:1, 4:5, 2.39:1), resolution and frame rate, SDR or HDR, language versions, captions and audio description, loudness specification, file deliverables and the review and approval steps. Get the distributor's or platform's delivery specification in writing and record its date; the deliverables decide settings from the first day (frame rate cannot be changed cleanly later).

## 2. Workflow, in order

1. **Ingest and protect**: copy camera cards with a checksum-verified offload tool (for example Hedge, ShotPut Pro, Silverstack, or `rsync --checksum` plus a hash manifest) to two places before formatting the card. Keep original folder structures; camera metadata depends on them.
2. **Organise**: one project folder template (`01_footage`, `02_audio`, `03_graphics`, `04_music`, `05_project`, `06_exports`), bins by scene or type, consistent clip names, synced audio (timecode or waveform sync), and logged selects with markers and keywords.
3. **Proxies**: edit with lightweight intraframe proxies (ProRes Proxy or LT, DNxHR LB, or H.264/H.265 at reduced resolution) when the originals are long-GOP, RAW or high resolution, and relink to originals for finishing. Check that proxies keep the same file names, frame rate and timecode.
4. **Assembly, rough cut, fine cut**: build the story first, then rhythm, then detail. Review on the target screen size (a 9:16 edit is judged on a phone).
5. **Picture lock**: no further timing changes. Hand off to sound, colour and graphics with an agreed interchange format (AAF for Avid and Pro Tools, XML or FCPXML, EDL for simple colour conform, OpenTimelineIO between tools), reference video with burnt-in timecode, and a list of every source file.
6. **Sound**: dialogue edit, noise reduction, music, effects, foley, mix, and stems (dialogue, music, effects, and a music-and-effects stem for language versions). Mix to the loudness specification of each deliverable (section 5).
7. **Colour**: conform, then correct, then grade ([color-grading-and-color-management](../color-grading-and-color-management/SKILL.md)).
8. **Graphics and titles**: titles, lower thirds, captions burnt in only where the platform needs it, credits; inside the title-safe area (section 4).
9. **Quality control (QC)**: watch the entire export at full screen with good audio, then check technically (section 7).
10. **Deliver and archive**: masters, platform files, captions, stems, project file, a media-managed copy of the used media, fonts and licence records.

## 3. Editing craft

- Cut for meaning: every shot answers "why this, why now". Cut on action or on a look to hide the cut; use J-cuts and L-cuts (sound leads or trails picture) for natural dialogue.
- Keep continuity: screen direction (the 180-degree rule), eyelines, props, and the pace of movement across cuts. Break it on purpose only.
- Rhythm comes from shot length, music and sound. Vary it; remove pauses that carry nothing. Walter Murch's "rule of six" (*In the Blink of an Eye*) ranks emotion first, then story, then rhythm, then eye-trace and spatial continuity.
- Social and web video: show the subject in the first seconds, design for sound off (on-screen text and captions), and keep text and faces out of the platform's interface areas.
- Interviews: never cut a person's words to change their meaning. Mark edits in a statement with a visual cut or B-roll rather than hiding them.
- Use only footage, music, sound effects and fonts licensed for this distribution (territory, media, duration, number of placements). Stock and music licences differ between social, broadcast and paid advertising.

## 4. Frames, rates and safe areas

- Keep the project frame rate equal to the main camera rate and the deliverable: 23.976 or 24 for film-style work, 25 or 50 in PAL regions, 29.97 or 59.94 in NTSC regions, 30 or 60 for screen recordings and many web uses. Converting between rate families needs optical-flow or frame-blending conversion and is visible; plan it.
- Timecode at 29.97 and 59.94 fps uses drop-frame counting (`;` separator) to match clock time; 23.976 has no drop-frame mode. Use the deliverable's convention.
- Shutter: the 180-degree rule (shutter about 1/(2 x frame rate)) gives natural motion blur; it matters for graphics too (motion blur on animated titles).
- Safe areas: SMPTE ST 2046-1 defines safe action as 93 percent and safe title as 90 percent of the width and height of the picture; many editing apps still default to older margins, so set the guides. Social platforms cover parts of vertical video with buttons and captions; use the platform's current safe-zone template.
- Aspect-ratio versions: frame wide and protect for vertical, or reframe each version by hand (auto-reframe tools are a start, not a finish).

## 5. Sound and loudness

Loudness is measured with ITU-R BS.1770 (LUFS, also written LKFS) and true peak in dBTP. Mix each deliverable to its own target; do not reuse a broadcast mix for a phone-first platform without checking.

| Deliverable | Integrated target | True-peak ceiling | Source |
| :--- | :--- | :--- | :--- |
| European broadcast | -23 LUFS (plus or minus 0.5 LU for most programmes) | -1 dBTP | EBU R 128 (version 5.0, 2023) |
| US broadcast | -24 LKFS | -2 dBTP | ATSC A/85 |
| Streaming and online audio (general) | -16 LUFS or quieter, not quieter than -20 LUFS | -1 dBTP | AES TD1004 |
| Netflix | -27 LKFS dialogue-gated (plus or minus 2 LU) | -2 dBTP | Netflix Sound Mix Specifications |
| Spotify (podcast and music video) | Normalises to -14 LUFS | -1 dBTP (-2 dBTP for louder masters) | Spotify for Artists |

Platform targets change; link and date the current specification in the delivery notes ([references/delivery-and-standards.md](references/delivery-and-standards.md) section 2). Measure with a BS.1770 meter (the loudness meter in DaVinci Resolve Fairlight, Premiere Pro, Final Cut Pro, Audition, iZotope RX or Insight, Youlean Loudness Meter, or FFmpeg `ebur128`), not by ear. Dialogue must stay intelligible on phone speakers: check a mono fold-down and a small-speaker playback.

## 6. Captions, subtitles and audio description

- Captions are required for prerecorded video with audio (WCAG 2.2 SC 1.2.2) and are used by many people without hearing loss. They include speaker identification and meaningful sounds. Subtitles translate dialogue only.
- Formats: WebVTT for the web (`<track kind="captions" srclang="en" label="English" src="captions.vtt" default>`), SRT for many platforms, TTML/IMSC for broadcast and streaming services, SCC or CEA-608/708 embedded captions for US broadcast. Keep a frame-accurate master file and convert from it.
- Style: Netflix's English guide allows 42 characters per line, two lines, up to 20 characters per second for adult programmes and 17 for children's; follow each distributor's own guide. Never cover on-screen text or faces; position captions higher when they would.
- Automatic speech recognition (Whisper, the editing app's transcription) is a draft. A person reviews names, terms, timing and punctuation before publishing.
- Audio description (SC 1.2.5, level AA) describes important visual information in pauses of the dialogue, or as extended description where pauses are too short. Provide a transcript for audio-only content and as a supplement.
- Burnt-in ("open") captions are only for platforms without caption support; keep a closed-caption file as well.

## 7. Export and quality control

- **Masters**: a high-quality intermediate at the project's resolution, frame rate and colour space (ProRes 422 HQ or 4444, DNxHR HQX or 444, or the distributor's IMF package), with separate stems. Export platform files from the master, not from another platform file.
- **Platform files**: follow the current official specification (YouTube's recommended upload settings, for example, list MP4, H.264 High profile, 4:2:0, closed GOP, AAC-LC or Opus at 48 kHz, BT.709 for SDR, the moov atom at the front, and the frame rate it was recorded at). Upload at the highest quality the platform accepts; it re-encodes everything.
- **Technical QC**: verify with `ffprobe` or MediaInfo (codec, profile, resolution, frame rate, scan type, colour primaries, transfer and matrix tags, audio channels and sample rate), measure loudness and true peak, check for flash frames, black or duplicated frames, audio sync, pops and clicks, and out-of-range video levels. Check accessibility: captions present and in sync, no flashing above the thresholds ([motion-graphics-and-animation](../motion-graphics-and-animation/SKILL.md) section 5).
- **Creative QC**: watch everything once, in one sitting, on the target device; check spelling of every title against a written script.

## 8. Video on the web

1. Encode with the template: `npm ci && npm test` in [assets/web-media-pipeline/](assets/web-media-pipeline/), then call `encodeForWeb(master, outDir, { maxHeight: 1080, webm: true })`. It produces H.264 MP4 (yuv420p, BT.709 tags, faststart, loudness-normalised AAC), an optional AV1 and Opus WebM, and a poster frame; every one of those properties is measured by the tests. It runs FFmpeg with argument arrays and refuses paths that FFmpeg would read as options or protocols.
2. Markup: offer the smaller AV1 file first and H.264 as the fallback, a poster, explicit width and height (no layout shift), captions, and no autoplay with sound.

   ```html
   <video controls preload="metadata" width="1280" height="720" poster="/media/intro-poster.jpg">
     <source src="/media/intro.webm" type='video/webm; codecs="av01.0.08M.08, opus"'>
     <source src="/media/intro.mp4" type='video/mp4; codecs="avc1.640028, mp4a.40.2"'>
     <track kind="captions" srclang="en" label="English" src="/media/intro.en.vtt" default>
   </video>
   ```

   Read the real codec strings with `ffprobe` or MP4Box rather than copying these examples; a wrong string makes the browser skip a source it could play.
3. Background or hero video: muted, `playsinline`, short, with a visible pause control (SC 2.2.2 for motion longer than five seconds), a static poster instead of playback for `prefers-reduced-motion: reduce`, and lazy loading below the fold. Never use video for content that should be text.
4. Long or large video: adaptive streaming (HLS or DASH, packaged as CMAF) through a video platform (Mux, Cloudflare Stream, Bunny Stream, Vimeo, AWS Elemental MediaConvert, or self-hosted with FFmpeg or Shaka Packager), played with the browser's native HLS where it exists, otherwise [hls.js](https://github.com/video-dev/hls.js), [dash.js](https://github.com/Dash-Industry-Forum/dash.js) or [Shaka Player](https://github.com/shaka-project/shaka-player). Media Source Extensions are not Baseline (web-features, checked 2026-10-18: `media-source` limited; iPhone Safari uses Managed Media Source), so test on real devices.
5. Players: the native `<video>` element first; [Media Chrome](https://github.com/muxinc/media-chrome), [Vidstack](https://github.com/vidstack/player) or [Video.js](https://github.com/videojs/video.js) when you need custom accessible controls. Check keyboard operation, focus visibility, labelled buttons and caption controls ([accessibility-audit](../accessibility-audit/SKILL.md)).
6. Performance: keep hero video out of the Largest Contentful Paint path (the poster image can be the LCP element), set `preload="none"` or `"metadata"`, serve from a CDN with HTTP range requests, and check the weight against the page budget ([12-web-performance](../../rules/12-web-performance.md)).
7. Security and privacy: embedding a third-party player loads its scripts and cookies; use the privacy-enhanced embed mode or a click-to-load facade, list the origins in the Content Security Policy (`media-src`, `frame-src`), and treat user-uploaded video as untrusted input (validate the container with `ffprobe`, transcode on an isolated worker, never pass user file names to a shell).

## 9. Video in code and in the browser

- **Programmatic video** (templated social clips, data-driven video, personalised renders): [Remotion](https://www.remotion.dev/) (React; free for individuals, companies of up to three employees and non-profits, otherwise a company licence is needed: read [remotion.dev/license](https://www.remotion.dev/license)), [Motion Canvas](https://motioncanvas.io/) (TypeScript, MIT), FFmpeg filter graphs, or the motion tools in [motion-graphics-and-animation](../motion-graphics-and-animation/SKILL.md).
- **Browser-side processing**: WebCodecs for frame-accurate encode and decode (not Baseline, checked 2026-10-18: `webcodecs` limited, so feature-detect and keep a server path), [Mediabunny](https://mediabunny.dev/) (MPL-2.0) for reading and writing containers on top of WebCodecs, and [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) for compatibility at a large download and speed cost. `requestVideoFrameCallback` is Baseline newly available since 2024-10-29.
- **Capabilities**: ask `navigator.mediaCapabilities.decodingInfo()` (Baseline widely available) whether a codec and resolution play smoothly and power-efficiently before choosing a source in script.

## 10. Done when

- [ ] Deliverables, specifications and their dates recorded; settings match them
- [ ] Every source (footage, music, effects, fonts, stock, AI-generated material) licensed for this use and recorded
- [ ] Loudness and true peak measured per deliverable and within the target
- [ ] Captions reviewed by a person; audio description or transcript where required; no flashing above the thresholds
- [ ] Technical QC done with `ffprobe` or MediaInfo; full creative watch-through done on the target device
- [ ] Web video: poster, dimensions, captions, pause control, reduced-motion behaviour, page weight checked
- [ ] Master, stems, captions, project and used media archived with a checksum manifest
