---
name: motion-and-interaction
description: Design and implement UI motion and micro-interactions - purposeful animation, durations and easing tokens, transitions between states and pages (View Transitions API), scroll effects, gestures, loading and feedback animations, reduced-motion alternatives, and performance - with CSS, the Web Animations API, Motion, GSAP, Lottie or Rive. Use when adding animation or transitions, designing hover, press, loading or success feedback, animating route changes, building interactive illustrations, or when motion feels janky or excessive.
license: MIT
metadata:
  version: "1.0.0"
---

# Motion and Interaction

Motion should explain (where something came from, what changed, what is happening), not decorate. It must respect people who are made ill or distracted by it ([10-accessibility](../../rules/10-accessibility.md)). Animation as content (titles, explainers, Lottie and Rive files, flash testing, safe use of animation runtimes) is in [motion-graphics-and-animation](../motion-graphics-and-animation/SKILL.md).

## 1. Decide whether to animate

Animate to: show cause and effect (a button press, an item added to a cart), preserve context across a change (expanding a card into a page), indicate progress or system status, or draw attention to something important once. Do not animate to fill time, delay users, or loop decorations next to reading content.

## 2. Timing and easing tokens

| Token | Typical value | Use |
| :--- | :--- | :--- |
| `motion.duration.fast` | 100 to 150 ms | Hover, press, small state changes |
| `motion.duration.normal` | 200 to 300 ms | Panels, menus, toasts, most transitions |
| `motion.duration.slow` | 300 to 500 ms | Large or full-screen transitions |
| `motion.easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` | Elements moving on screen |
| `motion.easing.enter` (decelerate) | Ease-out curve | Elements entering |
| `motion.easing.exit` (accelerate) | Ease-in curve | Elements leaving (often shorter than entering) |

Keep motion values in tokens ([design-system-and-tokens](../design-system-and-tokens/SKILL.md); the template includes `duration` and `cubicBezier` tokens). Platform guidance: [Material Design 3 motion](https://m3.material.io/styles/motion/overview), [Apple HIG motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Fluent 2 motion](https://fluent2.microsoft.design/motion).

## 3. Implement, simplest tool first

| Need | Tool |
| :--- | :--- |
| State changes (hover, open, selected) | CSS `transition` on `transform`, `opacity`, colours; `@starting-style` and `transition-behavior: allow-discrete` for entering elements and `display`/popover/dialog |
| Keyframe sequences | CSS `@keyframes`, or the Web Animations API (`element.animate()`) for JS control |
| Page and state transitions | View Transitions API (`document.startViewTransition()`; same-document is Baseline newly available since October 2025; cross-document is still limited), or the framework's integration |
| Scroll-linked effects | CSS scroll-driven animations as progressive enhancement (limited support), else `IntersectionObserver` |
| Complex choreography, gestures, layout animation in React/Vue | [Motion](https://motion.dev/) |
| Timelines, SVG morphing, scroll storytelling | [GSAP](https://gsap.com/docs/v3/) |
| Designer-made vector animation | [Lottie](https://airbnb.io/lottie/) / dotLottie, or [Rive](https://rive.app/docs/) for interactive state machines |
| 3D | three.js, React Three Fiber, Spline exports |

## 4. Reduced motion and accessibility

- Wrap non-essential motion in `@media (prefers-reduced-motion: no-preference)`, or provide a reduced alternative (fade instead of slide or zoom; no parallax; no auto-playing video backgrounds). In JS, check `matchMedia("(prefers-reduced-motion: reduce)")`; Motion and GSAP provide helpers (`useReducedMotion`, `gsap.matchMedia()`).
- Nothing flashes more than three times per second. Auto-playing motion longer than five seconds needs a pause control.
- Animations never block input or hide focus; content is usable before an entrance animation finishes.
- Announce outcomes for screen readers with live regions; a spinner alone is not an announcement.

## 5. Performance

- Animate `transform` and `opacity` (compositor-friendly). Avoid animating `width`, `height`, `top`, `left`, `box-shadow` on large areas; use `transform: scale` or pseudo-elements instead.
- Use `will-change` sparingly and temporarily. Check frames in the DevTools Performance panel and keep INP within budget ([12-web-performance](../../rules/12-web-performance.md)).
- Lazy-load heavy animation runtimes and assets (Lottie JSON, Rive files, 3D scenes) and provide a static poster.

## 6. Specify motion for handoff

For each animation: trigger, property changes, duration token, easing token, delay and stagger, what happens on interruption, and the reduced-motion alternative. Prototype complex motion in code or a motion tool and share the reference.

## 7. Done when

- [ ] Each animation has a stated purpose; none delays the user
- [ ] Durations and easing come from tokens
- [ ] Reduced-motion alternative implemented and tested with the OS setting or DevTools emulation
- [ ] Smooth on a mid-range phone; no layout shift caused by animation
