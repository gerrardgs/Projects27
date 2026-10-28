# WCAG 2.2 Level A and AA checklist

Condensed from [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (W3C Recommendation, 5 October 2023, updated December 2024). The normative text and the "Understanding" documents are the authority; follow the links for each criterion's intent, examples and failures. Quick reference with techniques: [How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/). Criteria new in 2.2 are marked **new**. SC 4.1.1 Parsing was removed in 2.2.

## 1. Perceivable

| SC | Level | Check |
| :--- | :--- | :--- |
| 1.1.1 Non-text content | A | Images, icons, charts, CAPTCHAs have text alternatives; decorative images `alt=""` |
| 1.2.1 Audio-only and video-only (prerecorded) | A | Transcript, or audio/text alternative |
| 1.2.2 Captions (prerecorded) | A | Accurate, synchronised captions |
| 1.2.3 Audio description or media alternative | A | Visual information available to blind users |
| 1.2.4 Captions (live) | AA | Live captions |
| 1.2.5 Audio description (prerecorded) | AA | Audio description track or narration |
| 1.3.1 Info and relationships | A | Headings, lists, tables, labels, groups in markup, not just visuals |
| 1.3.2 Meaningful sequence | A | DOM order matches reading order |
| 1.3.3 Sensory characteristics | A | Instructions not only by shape, position, sound ("click the round button on the right") |
| 1.3.4 Orientation | AA | Works in portrait and landscape |
| 1.3.5 Identify input purpose | AA | `autocomplete` tokens on personal-data fields |
| 1.4.1 Use of colour | A | Colour never the only means; links in text distinguishable |
| 1.4.2 Audio control | A | Auto-playing audio over 3 s can be paused or muted |
| 1.4.3 Contrast (minimum) | AA | 4.5:1 text; 3:1 large text |
| 1.4.4 Resize text | AA | 200 percent without loss |
| 1.4.5 Images of text | AA | Real text instead of images of text |
| 1.4.10 Reflow | AA | 320 CSS px wide, no two-dimensional scrolling (except maps, tables, etc.) |
| 1.4.11 Non-text contrast | AA | 3:1 for UI component boundaries, states, focus indicators, meaningful graphics |
| 1.4.12 Text spacing | AA | Line height 1.5, paragraph spacing 2x, letter 0.12x, word 0.16x without loss |
| 1.4.13 Content on hover or focus | AA | Tooltips dismissible (Escape), hoverable, persistent |

## 2. Operable

| SC | Level | Check |
| :--- | :--- | :--- |
| 2.1.1 Keyboard | A | All functionality by keyboard |
| 2.1.2 No keyboard trap | A | Focus can always move away |
| 2.1.4 Character key shortcuts | A | Single-key shortcuts can be turned off or remapped |
| 2.2.1 Timing adjustable | A | Time limits can be turned off, adjusted or extended |
| 2.2.2 Pause, stop, hide | A | Moving, blinking, auto-updating content controllable |
| 2.3.1 Three flashes or below threshold | A | No more than 3 flashes per second |
| 2.4.1 Bypass blocks | A | Skip link or landmarks |
| 2.4.2 Page titled | A | Unique, descriptive `<title>` |
| 2.4.3 Focus order | A | Logical order |
| 2.4.4 Link purpose (in context) | A | Link text plus context explains destination |
| 2.4.5 Multiple ways | AA | Search, sitemap or navigation to find pages |
| 2.4.6 Headings and labels | AA | Descriptive |
| 2.4.7 Focus visible | AA | Visible keyboard focus indicator |
| 2.4.11 Focus not obscured (minimum) | AA | **New.** Focused element not entirely hidden by sticky content |
| 2.5.1 Pointer gestures | A | Multipoint or path gestures have single-pointer alternatives |
| 2.5.2 Pointer cancellation | A | Actions on up-event, can be aborted |
| 2.5.3 Label in name | A | Accessible name contains the visible label text |
| 2.5.4 Motion actuation | A | Shake/tilt functions have UI alternatives and can be disabled |
| 2.5.7 Dragging movements | AA | **New.** Single-pointer alternative to dragging |
| 2.5.8 Target size (minimum) | AA | **New.** At least 24 by 24 CSS px, or spacing exception |

## 3. Understandable

| SC | Level | Check |
| :--- | :--- | :--- |
| 3.1.1 Language of page | A | `<html lang>` |
| 3.1.2 Language of parts | AA | `lang` on passages in other languages |
| 3.2.1 On focus | A | No context change on focus |
| 3.2.2 On input | A | No unexpected context change on input |
| 3.2.3 Consistent navigation | AA | Same order across pages |
| 3.2.4 Consistent identification | AA | Same function, same label |
| 3.2.6 Consistent help | A | **New.** Help mechanisms in the same relative place |
| 3.3.1 Error identification | A | Errors described in text |
| 3.3.2 Labels or instructions | A | Visible labels and needed instructions |
| 3.3.3 Error suggestion | AA | Suggest corrections |
| 3.3.4 Error prevention (legal, financial, data) | AA | Reversible, checked or confirmed |
| 3.3.7 Redundant entry | A | **New.** Do not ask again for information already given in the process |
| 3.3.8 Accessible authentication (minimum) | AA | **New.** No cognitive function test without an alternative (allow paste, password managers, passkeys) |

## 4. Robust

| SC | Level | Check |
| :--- | :--- | :--- |
| 4.1.2 Name, role, value | A | Custom controls expose name, role, state to assistive technology |
| 4.1.3 Status messages | AA | Announced via live regions without focus change |

## Related W3C resources

- [WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/): patterns and keyboard interaction for widgets.
- [Using ARIA](https://www.w3.org/TR/using-aria/) and [ARIA in HTML](https://www.w3.org/TR/html-aria/): what ARIA is allowed on which element.
- [WCAG-EM evaluation methodology](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/) and the [Report Tool](https://www.w3.org/WAI/eval/report-tool/).
- [Easy Checks: a first review](https://www.w3.org/WAI/test-evaluate/preliminary/).
- [What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/).
- [WCAG 3.0 Working Draft](https://www.w3.org/TR/wcag-3.0/) (not for conformance claims).
- Mobile: [Mobile accessibility at W3C](https://www.w3.org/WAI/standards-guidelines/mobile/); [Apple accessibility for developers](https://developer.apple.com/accessibility/); [Android accessibility](https://developer.android.com/guide/topics/ui/accessibility).
- Documents and PDF: [PDF/UA (ISO 14289)](https://pdfa.org/resource/iso-14289-pdfua/), [Adobe Acrobat accessibility](https://helpx.adobe.com/acrobat/using/create-verify-pdf-accessibility.html), [PAC PDF Accessibility Checker](https://pac.pdf-accessibility.org/).
