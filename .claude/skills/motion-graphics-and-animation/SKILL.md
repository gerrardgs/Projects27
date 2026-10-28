---
name: motion-graphics-and-animation
description: Design and produce motion graphics and animation for video, social, broadcast, product and the web - storyboards and animatics, the twelve principles of animation, timing and easing curves, kinetic typography, logo animation, explainers, lower thirds and titles, character and 2D/3D animation, compositing and visual effects, and exports (ProRes 4444 or video with alpha, image sequences, Lottie and dotLottie, Rive, WebM, animated images) - with After Effects, Cavalry, Rive, Lottie, Jitter, Figma, Blender, Cinema 4D, Fusion, Apple Motion, Remotion and Motion Canvas, including photosensitive-seizure (flash and pattern) safety checks, reduced-motion alternatives, and safe use of animation runtimes on websites. Use when creating animated titles, explainers, logo stings, social motion, UI or product animation files, Lottie or Rive assets, or when checking animation for flashing and accessibility.
license: MIT
metadata:
  version: "1.0.0"
---

# Motion Graphics and Animation

This skill covers animation as content: titles, explainers, brand motion, social and video graphics, and animation files that ship in products. Interface transitions and micro-interactions built in code are in [motion-and-interaction](../motion-and-interaction/SKILL.md); editing and delivery are in [video-editing-and-post-production](../video-editing-and-post-production/SKILL.md). Tools and standards are in [references/tools-and-safety.md](references/tools-and-safety.md).

## 1. Brief, script and storyboard

1. Brief: the one message, audience, platform and aspect ratios, duration, sound or sound-off viewing, brand motion rules, deliverables and formats, deadline.
2. Script and voice-over first for explainers; the words set the timing.
3. Style frames: two or three key frames that fix the look (type, colour, illustration style) before any animation.
4. Storyboard, then an animatic (timed boards with temporary voice and music) approved before full animation. Changes are cheap on boards and expensive in animation.

## 2. Principles that make motion read well

- **The twelve principles** (Frank Thomas and Ollie Johnston, *The Illusion of Life*, 1981): squash and stretch, anticipation, staging, straight-ahead and pose-to-pose, follow-through and overlapping action, slow in and slow out, arcs, secondary action, timing, exaggeration, solid drawing, and appeal. They apply to logos and interface elements as much as to characters.
- **Easing**: almost nothing in the real world starts or stops instantly. Shape the speed curve in the graph editor (value and speed graphs), not only the keyframe interpolation preset. Entrances decelerate, exits accelerate, and moves within the frame ease both ways.
- **Timing and spacing**: think in frames at the project rate. Small elements move faster than large ones; heavy things take longer to start and stop.
- **Hierarchy in time**: one thing moves at a time where attention matters; stagger related elements with offsets; leave holds so the viewer can read.
- **Continuity**: motion carries the eye to the next important point; match direction and speed across cuts and transitions.
- **Brand motion systems**: write down durations, curves, transition types, and how the logo and type move, so every piece feels related (the same idea as motion tokens in [design-system-and-tokens](../design-system-and-tokens/SKILL.md)).

## 3. Typography in motion

- Text must stay on screen long enough to be read comfortably by a slow reader, with the motion settled before reading starts. Do not animate text while people are expected to read it.
- Use the brand's licensed fonts and check that the licence covers video, broadcast or app embedding ([13-visual-assets-and-licensing](../../rules/13-visual-assets-and-licensing.md)).
- Keep titles inside the title-safe area (SMPTE ST 2046-1: 90 percent) and out of platform interface zones in vertical video.
- Contrast: text over moving footage needs a scrim, shadow or panel so it meets 4.5:1 across every frame, not only the first.
- Captions are separate from kinetic type: animated words are not a substitute for a caption track ([video-editing-and-post-production](../video-editing-and-post-production/SKILL.md) section 6).

## 4. Build and export

- **Project hygiene**: named layers and precompositions or groups, a project folder template, linked (not embedded) assets, expressions and rigs documented, fonts and plug-ins listed with their licences. Render tests at final resolution early.
- **Rigs**: controllers and expressions in After Effects, procedural setups in Cavalry, state machines in Rive, and constraints in Figma or Jitter, so changes and versions are quick.
- **Exports**

| Use | Export |
| :--- | :--- |
| Edit or composite with transparency | ProRes 4444 with alpha, or a PNG or OpenEXR image sequence |
| Video delivery | The deliverable's codec from the master (see the video skill); render with motion blur for fast moves |
| Web and apps, vector animation | Lottie JSON or dotLottie (`.lottie`, compressed, can bundle several animations and themes); Rive (`.riv`) for interactive animation with state machines |
| Web, raster or complex animation | Muted MP4 (H.264) and WebM (AV1 or VP9); VP9 WebM with alpha for transparency in Chromium-based browsers and HEVC with alpha for Safari (test every target browser) |
| Short loops in chat or email | Animated WebP or AVIF where supported, GIF only when nothing else plays; always a static first frame that makes sense |

- Lottie files must use only features the target player supports: check with the [Lottie specification](https://lottie.github.io/) (Lottie Animation Community, version 1.0.1, June 2025) and preview in the actual runtime (lottie-web, dotLottie, the iOS and Android players), not only in the export plug-in.

## 5. Flashing, patterns and motion sensitivity

Flashing and some patterns can trigger seizures in people with photosensitive epilepsy; large or fast motion can cause nausea and dizziness in people with vestibular disorders.

- **Limits**: nothing flashes more than three times in any one-second period unless it stays below the general and red flash thresholds (WCAG 2.2 SC 2.3.1; a flash is a pair of opposing luminance changes of 10 percent or more of maximum relative luminance where the darker state is below 0.80, and the combined flashing area is more than about a quarter of a 10-degree visual field). Avoid saturated red flashes entirely. Avoid high-contrast stripes, checkerboards and spirals that move, flicker or fill much of the screen.
- **Broadcast and advertising**: UK broadcasters follow the Ofcom guidance on flashing images and regular patterns, and UK advertising must pass a Harding Flash and Pattern Analyser test or equivalent; many broadcasters and distributors elsewhere ask for a Harding (or equivalent) pass certificate with delivery. In the UK, sending or showing flashing images electronically with intent to cause harm to a person with epilepsy is a criminal offence (Online Safety Act 2023, Part 10).
- **Test**: the free [PEAT](https://trace.umd.edu/peat/) tool for web content and software (its licence forbids use on commercial broadcast, film, home entertainment or games content), and [Harding FPA](https://www.hardingfpa.com/) (commercial) for broadcast, film, games and advertising. Test the final render, including transitions and edits between clips.
- **Fix**: reduce the rate (fewer than three flashes per second), the contrast between states, or the flashing area; replace strobes with slower pulses or dissolves.
- **Reduced motion**: on the web, give a static or gently cross-faded alternative under `prefers-reduced-motion: reduce`, a pause control for motion lasting more than five seconds (SC 2.2.2), and no parallax or zooming backgrounds for those users ([10-accessibility](../../rules/10-accessibility.md)).

## 6. Shipping animation runtimes on the web

- Load runtimes lazily, only on pages that use them, and show a poster frame until the animation is ready; check the bundle size and main-thread time ([12-web-performance](../../rules/12-web-performance.md)).
- Pin exact versions and install from the registry with a lockfile; do not load an unpinned "latest" from a CDN. In October 2024 an attacker used a stolen token to publish malicious versions 2.0.5 to 2.0.7 of `@lottiefiles/lottie-player`, and sites that loaded the latest version from a CDN served a crypto-wallet drainer to visitors ([Wiz](https://wiz.io/blog/lottie-player-supply-chain-attack)). Use Subresource Integrity for any CDN script ([04-dependencies](../../rules/04-dependencies.md)).
- Treat animation files from outside the team as untrusted input. The full lottie-web build evaluates After Effects expressions with `eval` (the `lottie_light` builds do not), which also needs `'unsafe-eval'` in the Content Security Policy; use a light build or dotLottie, and never accept user-uploaded Lottie files into the full player.
- Current runtimes (npm, 2026-10-18): `@lottiefiles/dotlottie-web` 0.81.0 (MIT), `lottie-web` 5.13.0 (MIT), `@rive-app/canvas` 2.45.0 (MIT). Check each package's documentation for the API of the installed version.
- Accessibility of the element: decorative animations get `aria-hidden="true"`; meaningful ones get a text alternative, and interactive Rive or Lottie controls need real buttons with labels and keyboard support.

## 7. Done when

- [ ] Animatic approved before final animation; deliverables and formats match the brief
- [ ] Easing, timing and holds reviewed at full speed and frame by frame; text readable and inside safe areas
- [ ] Fonts, music, sound effects, stock elements and plug-ins licensed for this use
- [ ] Flash and pattern test passed on the final render (PEAT or Harding as appropriate); report kept with the delivery
- [ ] Web: reduced-motion alternative, pause control, poster frame, pinned runtime versions, light or safe player for external files, size budget met
- [ ] Project, rigs, fonts list and exports archived
