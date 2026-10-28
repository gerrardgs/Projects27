# Design system tooling and references

Versions checked against the npm registry on 2026-10-15. Re-check with `npm view <package> version` before relying on them.

## Standards

| Item | Status | Link |
| :--- | :--- | :--- |
| Design Tokens Format Module 2025.10 | First stable version (28 October 2025), a W3C Community Group Final Report, not a W3C Standard | [Format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), [designtokens.org](https://www.designtokens.org/) |
| Design Tokens Resolver Module 2025.10 | Final Community Group Report (28 October 2025) for themes, modes and brands; the `version` value is `2025.10` (placeholder dates in the published text were corrected in [PR #357](https://github.com/design-tokens/community-group/pull/357) and [PR #408](https://github.com/design-tokens/community-group/pull/408)) | [Resolver](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/) |
| DTCG FAQ and tool support | Lists implementing tools | [FAQ](https://www.designtokens.org/faq/) |

## Token tools

| Tool | Package | Version | Docs |
| :--- | :--- | :--- | :--- |
| Style Dictionary | `style-dictionary` | 5.6.1 | [styledictionary.com](https://styledictionary.com/) |
| Terrazzo (DTCG-native token tool with resolver support) | `@terrazzo/cli` | 2.9.0 | [terrazzo.app](https://terrazzo.app/docs/), [resolvers](https://terrazzo.app/docs/guides/resolvers/) |
| Tokens Studio transforms for Style Dictionary | `@tokens-studio/sd-transforms` | 2.0.3 | [GitHub](https://github.com/tokens-studio/sd-transforms) |
| Tokens Studio for Figma | Figma plugin | | [docs.tokens.studio](https://docs.tokens.studio/) |
| Figma variables | Built into Figma; REST API endpoints for variables | | [Variables guide](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma), [REST API: variables](https://developers.figma.com/docs/rest-api/variables/) |
| Penpot design tokens | Built into Penpot | | [Penpot help](https://help.penpot.app/) |
| Colour math in JS | `culori` 4.0.2, `colorjs.io` 0.7.1 | | [culori](https://culorijs.org/), [Color.js](https://colorjs.io/) |

## Component foundations (headless, accessible)

| Library | Framework | Package | Version | Docs |
| :--- | :--- | :--- | :--- | :--- |
| React Aria Components | React | `react-aria-components` | 1.22.1 | [react-spectrum.adobe.com/react-aria](https://react-spectrum.adobe.com/react-aria/) |
| Radix Primitives | React | `@radix-ui/react-*` | e.g. dialog 1.3.1 | [radix-ui.com/primitives](https://www.radix-ui.com/primitives) |
| Headless UI | React, Vue | `@headlessui/react` | 2.2.10 | [headlessui.com](https://headlessui.com/) |
| Ark UI | React, Vue, Solid, Svelte | `@ark-ui/react` and others | 5.39.3 | [ark-ui.com](https://ark-ui.com/) |
| shadcn/ui | React (copies source into your project) | CLI `shadcn` | 4.21.5 | [ui.shadcn.com](https://ui.shadcn.com/) |
| Angular CDK | Angular | `@angular/cdk` | 22.2.3 | [material.angular.dev/cdk](https://material.angular.dev/cdk/categories) |
| Bits UI | Svelte | `bits-ui` | 2.19.5 | [bits-ui.com](https://bits-ui.com/) |

Note: the npm package `@shadcn/ui` (0.0.4, last published March 2023) is the old CLI name; the current CLI is `shadcn`. This is exactly the kind of name to verify before installing.

## Documentation and workshop

| Tool | Package | Version | Docs |
| :--- | :--- | :--- | :--- |
| Storybook | `storybook` | 10.6.2 | [storybook.js.org/docs](https://storybook.js.org/docs) |
| Storybook accessibility addon | `@storybook/addon-a11y` | 10.6.2 | [Accessibility tests](https://storybook.js.org/docs/writing-tests/accessibility-testing) |
| Chromatic (visual testing service for Storybook) | `chromatic` | 18.12.2 | [chromatic.com/docs](https://www.chromatic.com/docs/) |
| Zeroheight, Supernova, Knapsack | Hosted design system documentation | | Vendor sites |

## Public design systems to learn from

| System | Organisation | Link |
| :--- | :--- | :--- |
| Material Design 3 | Google | [m3.material.io](https://m3.material.io/) |
| Human Interface Guidelines | Apple | [developer.apple.com/design](https://developer.apple.com/design/human-interface-guidelines/) |
| Fluent 2 | Microsoft | [fluent2.microsoft.design](https://fluent2.microsoft.design/) |
| Carbon | IBM | [carbondesignsystem.com](https://carbondesignsystem.com/) |
| Polaris | Shopify | [shopify.dev/docs/api/polaris](https://shopify.dev/docs/api/polaris) |
| Primer | GitHub | [primer.style](https://primer.style/) |
| Atlassian Design System | Atlassian | [atlassian.design](https://atlassian.design/) |
| Spectrum | Adobe | [spectrum.adobe.com](https://spectrum.adobe.com/) |
| Base Web | Uber | [baseweb.design](https://baseweb.design/) |
| Lightning Design System | Salesforce | [lightningdesignsystem.com](https://www.lightningdesignsystem.com/) |
| GOV.UK Design System | UK Government | [design-system.service.gov.uk](https://design-system.service.gov.uk/) |
| U.S. Web Design System | US Government | [designsystem.digital.gov](https://designsystem.digital.gov/) |
| Gestalt | Pinterest | [gestalt.pinterest.systems](https://gestalt.pinterest.systems/) |
| Elastic UI | Elastic | [eui.elastic.co](https://eui.elastic.co/) |

Collections: [Design Systems Repo](https://designsystemsrepo.com/), [Component Gallery](https://component.gallery/), [Adele by UXPin](https://adele.uxpin.com/).

## Reading

- [Atomic Design (Brad Frost)](https://atomicdesign.bradfrost.com/), free online book.
- [Design Systems Handbook (InVision, archived)](https://www.designbetter.co/design-systems-handbook) and [designsystems.com](https://www.designsystems.com/) by Figma.
- [Nathan Curtis: EightShapes articles on design systems](https://medium.com/eightshapes-llc).
