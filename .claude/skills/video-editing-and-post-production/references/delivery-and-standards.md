# Video Delivery: Standards, Specifications and Tools

Checked 2026-10-18. Standards are revised and platform specifications change without notice: open the linked source on the day of delivery and record its date in the delivery notes.

## 1. Codecs and containers

| Codec | Type | Typical use | Notes |
| :--- | :--- | :--- | :--- |
| Apple ProRes (Proxy, LT, 422, 422 HQ, 4444, 4444 XQ, RAW) | Intraframe intermediate | Editing, mastering, many delivery specifications | Large files, fast to edit; encoders on macOS, in FFmpeg (`prores_ks`) and in licensed apps on Windows |
| Avid DNxHD and DNxHR (LB, SQ, HQ, HQX, 444) | Intraframe intermediate | Avid workflows, cross-platform mastering | DNxHR covers resolutions above HD; MXF or MOV container |
| H.264 / AVC | Long-GOP delivery | Web, social, almost every device | High profile, 8-bit 4:2:0 for widest playback; hardware decode everywhere |
| H.265 / HEVC | Long-GOP delivery | 4K and HDR delivery, Apple devices | Browser support depends on the operating system and hardware; patent licensing applies |
| AV1 | Long-GOP delivery | Web and streaming at lower bitrates | Royalty-free (Alliance for Open Media); encoders SVT-AV1, libaom, hardware on recent GPUs |
| VP9 | Long-GOP delivery | WebM on the web, YouTube | Largely superseded by AV1 for new work |
| JPEG 2000 / HTJ2K | Intraframe | IMF and DCP masters | Digital Cinema Packages use JPEG 2000 |
| AAC-LC, Opus | Audio delivery | MP4 (AAC) and WebM (Opus) | 48 kHz for video |
| PCM (WAV, BWF) | Uncompressed audio | Masters, stems, broadcast | 48 kHz, 24-bit is the post-production norm |

Containers: MOV and MXF for intermediates; MP4 for delivery (put the `moov` box first with `-movflags +faststart`); WebM for VP9 or AV1 with Opus; MXF OP1a or AS-11 for broadcast files; IMF (SMPTE ST 2067) for streaming-service masters; DCP for cinema.

Intraframe codecs compress each frame separately (smooth scrubbing, larger files). Long-GOP codecs compress across frames (small files, heavier to edit); transcode or proxy them for editing.

Browser playback depends on the codec, profile, level and device. Read the [MDN web video codec guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs) and the [codecs parameter guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/codecs_parameter), then test with `HTMLMediaElement.canPlayType()` and `navigator.mediaCapabilities.decodingInfo()` on real devices.

## 2. Loudness and audio

| Specification | Target | True peak | Source |
| :--- | :--- | :--- | :--- |
| ITU-R BS.1770 | The measurement method (LUFS/LKFS, gating, true peak) | | [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770) |
| EBU R 128 (version 5.0, 2023) | -23 LUFS, tolerance plus or minus 0.5 LU (plus or minus 1 LU where exact normalisation is not achievable, for example live) | -1 dBTP | [EBU R 128](https://tech.ebu.ch/publications/r128) |
| EBU R 128 s2 | Loudness for streaming and online distribution | | [EBU R 128 s2](https://tech.ebu.ch/publications/r128s2) |
| ATSC A/85 (2026-07) | -24 LKFS for US digital television | -2 dBTP | [ATSC A/85:2026-07](https://www.atsc.org/wp-content/uploads/2026/07/A85-2026-07.pdf) |
| AES TD1004 | Streaming and network audio: not louder than -16 LUFS, not quieter than -20 LUFS | -1 dBTP maximum | [AES TD1004](https://aes.org/wp-content/uploads/2024/01/AESTD1004_1_15_10.pdf) |
| Netflix | -27 LKFS dialogue-gated, plus or minus 2 LU | -2 dBTP | [Netflix Sound Mix Specifications](https://backlothelp.netflix.com/hc/en-us/articles/360001794307-Netflix-Sound-Mix-Specifications-Best-Practices-v1-5) |
| Spotify | Plays back normalised to -14 LUFS by default | Below -1 dBTP; below -2 dBTP for masters louder than -14 LUFS | [Spotify loudness normalisation](https://support.spotify.com/us/artists/article/loudness-normalization/) |

FFmpeg measures with `ebur128=peak=true` and normalises with two-pass `loudnorm` (measure, then apply the measured values with `linear=true`); both are documented in the [FFmpeg filters manual](https://ffmpeg.org/ffmpeg-filters.html). The template in [../assets/web-media-pipeline/](../assets/web-media-pipeline/) does this and verifies the result with an independent `ebur128` measurement.

## 3. Platform upload and delivery specifications

| Platform | Official source | What it covers |
| :--- | :--- | :--- |
| YouTube | [Recommended upload encoding settings](https://support.google.com/youtube/answer/1722171) | MP4, H.264 High profile, closed GOP, 4:2:0, AAC-LC or Opus at 48 kHz, BT.709 for SDR, bitrates per resolution and frame rate, HDR in a separate article |
| Netflix | [Netflix Partner Help Center](https://partnerhelp.netflixstudios.com/hc/en-us) | IMF delivery, sound mix, timed text style guides per language, [title safe and safe action](https://backlothelp.netflix.com/hc/en-us/articles/4406208331923-Title-Safe-and-Safe-Action-Best-Practices) |
| Vimeo | [Video compression guidelines](https://help.vimeo.com/hc/en-us/articles/12426043233169-Video-and-audio-compression-guidelines) | Upload codecs and bitrates |
| Meta (Facebook, Instagram), TikTok, LinkedIn, X, Snapchat, Pinterest | Each platform's ads or creator help centre | Aspect ratios, durations, file limits and interface safe zones change often: look them up on the day |
| Broadcast | The broadcaster's delivery specification (for example the UK DPP AS-11 specification) | File format, loudness, captions, QC including flashing checks |

## 4. Captions, subtitles and description

- [WebVTT](https://www.w3.org/TR/webvtt1/) (W3C) for the web; `<track>` cues, regions and positioning. Cue settings are Baseline widely available; regions are not (web-features, checked 2026-10-18).
- [IMSC (TTML profiles for subtitles and captions)](https://www.w3.org/TR/ttml-imsc1.2/) for streaming and broadcast delivery.
- [Netflix English (USA) Timed Text Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide): 42 characters per line, two lines maximum, up to 20 characters per second for adult and 17 for children's programmes. Each language has its own guide.
- [BBC Subtitle Guidelines](https://www.bbc.co.uk/accessibility/forproducts/guides/subtitles/) for broadcast style, timing and colour.
- WCAG 2.2: [captions (SC 1.2.2)](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html), [audio description (SC 1.2.5)](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-prerecorded.html), and the W3C [Media Accessibility User Requirements](https://www.w3.org/TR/media-accessibility-reqs/).
- Tools: [Subtitle Edit](https://github.com/SubtitleEdit/subtitleedit) (open source), the caption tools in Premiere Pro, DaVinci Resolve and Final Cut Pro, [Whisper](https://github.com/openai/whisper) for draft transcripts, and the platform's own editors.

## 5. Streaming and web playback

- HLS: [RFC 8216](https://datatracker.ietf.org/doc/html/rfc8216) and Apple's [HLS authoring specification](https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices) (ladders, segment durations, codecs).
- MPEG-DASH: [DASH Industry Forum](https://dashif.org/) guidelines; CMAF lets one set of segments serve both.
- Players: [hls.js](https://github.com/video-dev/hls.js) (1.7.3, Apache-2.0), [dash.js](https://github.com/Dash-Industry-Forum/dash.js) (5.2.1, BSD-3-Clause), [Shaka Player](https://github.com/shaka-project/shaka-player) (5.3.0, Apache-2.0), [Video.js](https://github.com/videojs/video.js) (10.1.0, Apache-2.0), [Media Chrome](https://github.com/muxinc/media-chrome) (4.19.3, MIT), [Vidstack](https://github.com/vidstack/player) (1.15.7, MIT). Versions from the npm registry on 2026-10-18.
- Packaging: [Shaka Packager](https://github.com/shaka-project/shaka-packager), FFmpeg's HLS and DASH muxers, or a hosted service (Mux, Cloudflare Stream, Bunny Stream, Vimeo, AWS Elemental MediaConvert).
- Browser APIs and their Baseline status (web-features 3.43.0, 2026-10-18): `video`, `webvtt`, `media-capabilities`, `dynamic-range`, `prefers-reduced-motion` widely available; `request-video-frame-callback` newly available (2024-10-29); `media-source`, `managed-media-source`, `webcodecs`, `picture-in-picture` and `video-dynamic-range` limited.

## 6. Interchange and finishing

- [OpenTimelineIO](https://opentimeline.io/) (Academy Software Foundation) converts timelines between editing tools; AAF (Avid, Pro Tools), FCPXML (Final Cut Pro), XML (Premiere Pro, Resolve) and CMX 3600 EDL (simple conforms) are the common formats.
- Inspect files with `ffprobe` (part of [FFmpeg](https://ffmpeg.org/)) and [MediaInfo](https://mediaarea.net/en/MediaInfo).
- Safe areas: SMPTE ST 2046-1 (safe action 93 percent, safe title 90 percent of the production aperture); Netflix's [title safe guidance](https://backlothelp.netflix.com/hc/en-us/articles/4406208331923-Title-Safe-and-Safe-Action-Best-Practices) applies it.

## 7. Applications

| Category | Tools |
| :--- | :--- |
| Professional editing | [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) (free and Studio editions; editing, Fusion compositing, colour, Fairlight audio), [Adobe Premiere Pro](https://www.adobe.com/products/premiere.html), [Final Cut Pro](https://www.apple.com/final-cut-pro/), [Avid Media Composer](https://www.avid.com/media-composer) |
| Quick, social and text-based editing | [CapCut](https://www.capcut.com/), [Descript](https://www.descript.com/) (edit by transcript), Premiere on iPhone (Adobe discontinued Premiere Rush; [support ended 30 September 2026](https://helpx.adobe.com/premiere-rush/premiere-rush-discontinuation.html)), [Clipchamp](https://clipchamp.com/), [iMovie](https://www.apple.com/imovie/) |
| Open source editing | [Kdenlive](https://kdenlive.org/), [Shotcut](https://shotcut.org/), [OpenShot](https://www.openshot.org/), [Blender](https://www.blender.org/) (Video Sequencer), [LosslessCut](https://github.com/mifi/lossless-cut) (cuts without re-encoding) |
| Encoding | [FFmpeg](https://ffmpeg.org/), [HandBrake](https://handbrake.fr/), Adobe Media Encoder, Apple Compressor, Resolve's Deliver page |
| Audio | [Audacity](https://www.audacityteam.org/), [REAPER](https://www.reaper.fm/), Avid Pro Tools, Adobe Audition, Fairlight (in Resolve), [iZotope RX](https://www.izotope.com/en/products/rx.html) (repair), [Youlean Loudness Meter](https://youlean.co/youlean-loudness-meter/) |
| Review and approval | [Frame.io](https://frame.io/), the review tools of Vimeo and Resolve, or shared links with time-coded comments |
| Offload and verification | [Hedge](https://hedge.video/), Pomfort Silverstack, ShotPut Pro, `rsync --checksum` with a hash manifest |

Choose by the team's existing workflow and the deliverables, not by trend. Free editions often cap resolution, codecs or collaboration; check the edition comparison before committing a project to one.
