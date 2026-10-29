# Assets

## Inventory

The apps ship no images, illustrations or custom fonts. Icons come from the platforms: Material Icons on Android, SF Symbols on iOS. The web app uses text and one inline SVG chart (`TrendChart.tsx`, drawn from data, not an asset file). `apps/web/public/sw.js` is code, not an asset.

## Fonts

System fonts only: `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif` on the web; Roboto (Android) and San Francisco (iOS) from the platforms. Nothing is downloaded, so there is no font licence to track and no layout shift from web fonts.

## Icons and images

| Platform | Icons used | Source |
| :--- | :--- | :--- |
| Android | `mic`, `stop`, `calendar_month`, `dashboard_outlined`, `add_circle_outline`, `list_alt`, `logout` | Material Icons bundled with the Flutter SDK |
| iOS | `mic`, `stop.circle`, `chart.bar`, `plus.circle`, `list.bullet` | SF Symbols through `systemImage` |
| Web | None | — |

## Licences and attribution

Material Icons: Apache License 2.0 (Google). SF Symbols: Apple's licence allows use in apps for Apple platforms only, so they must not be copied into the web or Android app. `cupertino_icons` (MIT) is a default Flutter dependency that the app does not use yet. No third-party image or font is included.

## Optimisation and delivery

The production web build (`vite build`) is about 272 kB of JavaScript (82 kB gzip) and 6 kB of CSS, with hashed file names that the service worker caches. The mobile apps use vector icons from the platform.

## Adding an asset

Check its licence at the official source and record it in this file with the source URL and date ([13-visual-assets-and-licensing](../.agents/rules/13-visual-assets-and-licensing.md)). Prefer SVG; export raster images at the sizes used, and strip private metadata first ([content-hygiene](../.agents/skills/content-hygiene/SKILL.md) section 3).
