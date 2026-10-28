# Motion Graphics: Tools, Formats and Safety References

Checked 2026-10-18. Package versions are from the npm registry on that date; confirm the installed version's documentation before writing code against it.

## 1. Applications

| Category | Tools |
| :--- | :--- |
| Motion graphics and compositing | Adobe After Effects, [Cavalry](https://cavalry.scenegroup.co/) (procedural 2D), [Apple Motion](https://www.apple.com/final-cut-pro/motion/), Fusion (in DaVinci Resolve), Nuke for compositing |
| Interface and product animation | [Rive](https://rive.app/docs) (interactive state machines, runtimes for web, iOS, Android, Flutter, games), [Jitter](https://jitter.video/) (browser-based, Figma import), [Figma prototyping](https://www.figma.com/prototyping/) (Smart Animate), [LottieFiles](https://lottiefiles.com/) (Lottie creation, editing and hosting), [Spline](https://spline.design/) (3D for the web) |
| 3D | [Blender](https://www.blender.org/features/animation/) (open source), [Cinema 4D](https://www.maxon.net/en/cinema-4d), [Houdini](https://www.sidefx.com/), Unreal Engine (Motion Design tools for broadcast graphics) |
| 2D character and frame-by-frame | [Toon Boom](https://www.toonboom.com/) Harmony, [Moho](https://moho.lostmarble.com/), [Synfig](https://www.synfig.org/) (open source), [OpenToonz](https://opentoonz.github.io/e/) (open source), Krita animation |
| Animation in code | [Remotion](https://www.remotion.dev/) (React video; free for individuals, companies of up to three people and non-profits, company licence otherwise), [Motion Canvas](https://motioncanvas.io/) (TypeScript, MIT), GSAP and Motion for web UI ([motion-and-interaction](../../motion-and-interaction/SKILL.md)), three.js for 3D |

## 2. Formats and runtimes

- **Lottie**: open JSON format for vector animation, maintained by the [Lottie Animation Community](https://lottie.github.io/) ([specification](https://lottie.github.io/lottie-spec/), version 1.0.1 of June 2025, with a validator). Exported from After Effects (Bodymovin or LottieFiles plug-ins), Figma plug-ins, Jitter, Cavalry and others.
- **dotLottie** (`.lottie`, [dotlottie.io](https://dotlottie.io/)): a ZIP container for Lottie animations with images, themes and state machines; player [`@lottiefiles/dotlottie-web`](https://github.com/LottieFiles/dotlottie-web) 0.81.0 (MIT).
- **lottie-web** ([airbnb/lottie-web](https://github.com/airbnb/lottie-web)) 5.13.0 (MIT): renderers SVG, canvas and HTML. The default build (`build/player/lottie.js`) contains `eval` for After Effects expressions; the `lottie_light` builds do not (checked in the 5.13.0 package).
- **Rive** (`.riv`): binary runtime format with state machines and data binding; web runtime [`@rive-app/canvas`](https://github.com/rive-app/rive-wasm) 2.45.0 (MIT). The editor is a commercial product with its own plans.
- **Video with alpha**: ProRes 4444 (editing), VP9 WebM with alpha (Chromium-based browsers), HEVC with alpha (Apple platforms), PNG or OpenEXR sequences (compositing).

## 3. Safety and accessibility references

| Topic | Source |
| :--- | :--- |
| Flash thresholds for web content | WCAG 2.2 [Understanding SC 2.3.1 Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html): general and red flash definitions, area of 0.006 steradians (about 341 by 256 pixels at 1024 by 768) |
| Pause and motion | [SC 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html); [SC 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) (level AAA, good practice) |
| UK television | Ofcom Broadcasting Code Section Two and the guidance note on flashing images and regular patterns (potentially harmful flash: a luminance change of 20 cd/m² or more where the darker image is below 160 cd/m², following ITU-R BT.1702) |
| UK advertising | [ASA: flashing images in advertising](https://www.asa.org.uk/news/flashing-images-in-advertising.html) (Harding test or equivalent) |
| UK criminal law | [Online Safety Act 2023, offences of sending or showing flashing images](https://www.legislation.gov.uk/ukpga/2023/50/part/10/crossheading/offences-of-sending-or-showing-flashing-images) |
| Test tools | [PEAT](https://trace.umd.edu/peat/) (free, Trace Research and Development Center; not licensed for commercial broadcast, film, home entertainment or games content), [Harding FPA](https://www.hardingfpa.com/) (commercial, broadcast standard) |
| Supply-chain incident | [Wiz: lottie-player supply chain attack](https://wiz.io/blog/lottie-player-supply-chain-attack) (30 October 2024, versions 2.0.5 to 2.0.7) |

## 4. Learning

- Frank Thomas and Ollie Johnston, *The Illusion of Life: Disney Animation* (1981): the twelve principles.
- Richard Williams, *The Animator's Survival Kit*: timing, spacing and mechanics.
- The platform motion guides for interface work: [Material Design 3 motion](https://m3.material.io/styles/motion/overview), [Apple Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion).
