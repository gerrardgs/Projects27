# Accessibility laws, tools and assistive technology

Legal summaries are orientation, not legal advice; check the official text and a qualified adviser for a specific case. Checked on 2026-10-15.

## Laws and standards

| Jurisdiction | Instrument | Technical standard | Notes and source |
| :--- | :--- | :--- | :--- |
| European Union | European Accessibility Act, Directive (EU) 2019/882 | EN 301 549 (web part references WCAG 2.1 AA) | Applies to covered products and services, including e-commerce, banking, e-books and transport services, from 28 June 2025; national laws implement it (for example Germany's BFSG). [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2019/882/oj), [European Commission](https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/union-equality-strategy-rights-persons-disabilities-2021-2030/european-accessibility-act_en) |
| European Union | Web Accessibility Directive (EU) 2016/2102 | EN 301 549 | Public sector websites and apps. [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2016/2102/oj) |
| European Union | EN 301 549 | Harmonised standard | V3.2.1 (2021) references WCAG 2.1. V4.1.1 (2026-09, adopted 24 August 2026) aligns clauses 9 to 11 with WCAG 2.2 and adds Annex ZB for the European Accessibility Act; it gives presumption of conformity once cited in the Official Journal. [ETSI deliverables](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/) |
| United States | ADA Title II rule (state and local government) | WCAG 2.1 AA | 2024 rule; an April 2026 interim final rule moved compliance to April 2027 (population 50,000 or more) and April 2028 (smaller entities). [ADA.gov](https://www.ada.gov/resources/2024-03-08-web-rule/) |
| United States | ADA Title III (businesses open to the public) | No regulation-specified standard; courts and settlements commonly reference WCAG 2.x AA | [ADA.gov web guidance](https://www.ada.gov/resources/web-guidance/) |
| United States | Section 508 (federal agencies) | Revised 508 Standards incorporate WCAG 2.0 AA | [Section508.gov](https://www.section508.gov/) |
| United Kingdom | Public Sector Bodies Accessibility Regulations 2018, Equality Act 2010 | WCAG 2.2 AA expected by GOV.UK guidance | [GOV.UK guidance](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps) |
| Canada | Accessible Canada Act; Ontario AODA | WCAG 2.0 AA (AODA) | [AODA](https://www.ontario.ca/page/how-make-websites-accessible) |
| Other | Many countries reference WCAG | | [W3C WAI policy list](https://www.w3.org/WAI/policies/) |

## Automated and semi-automated tools

| Tool | Type | Link |
| :--- | :--- | :--- |
| axe-core (`axe-core` 4.14.0), `@axe-core/playwright` 4.13.0 | Rules engine for browsers and tests | [GitHub](https://github.com/dequelabs/axe-core), [rule list](https://dequeuniversity.com/rules/axe/) |
| axe DevTools browser extension | Manual scanning, guided tests | [Deque](https://www.deque.com/axe/devtools/) |
| Lighthouse (`lighthouse` 13.5.0) | Accessibility category (uses axe-core) | [Chrome for Developers](https://developer.chrome.com/docs/lighthouse/overview) |
| WAVE | Browser extension and online checker | [wave.webaim.org](https://wave.webaim.org/) |
| Accessibility Insights | Microsoft's guided FastPass and assessment | [accessibilityinsights.io](https://accessibilityinsights.io/) |
| IBM Equal Access Checker | Browser extension and CI | [IBM Accessibility](https://www.ibm.com/able/toolkit/tools/) |
| Pa11y (`pa11y` 10.0.0, `pa11y-ci` 5.0.0) | Command-line and CI | [pa11y.org](https://pa11y.org/) |
| ARC Toolkit | Browser extension by TPGi | [TPGi](https://www.tpgi.com/arc-platform/arc-toolkit/) |
| Colour Contrast Analyser | Desktop contrast picker | [TPGi CCA](https://www.tpgi.com/color-contrast-checker/) |
| WebAIM Contrast Checker | Web | [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/) |
| Storybook a11y addon | Component-level axe checks | [Storybook docs](https://storybook.js.org/docs/writing-tests/accessibility-testing) |
| eslint-plugin-jsx-a11y, eslint-plugin-vuejs-accessibility, Angular ESLint template accessibility rules, svelte-check a11y warnings | Lint at write time | Package docs |
| VS Code: `deque-systems.vscode-axe-linter`, `webhint.vscode-webhint` | Editor linting | Marketplace |

## Assistive technology for testing

| Platform | Screen reader | Browser pairing | Guide |
| :--- | :--- | :--- | :--- |
| macOS, iOS, iPadOS | VoiceOver (built in) | Safari | [WebAIM: VoiceOver](https://webaim.org/articles/voiceover/), [Apple VoiceOver guide](https://support.apple.com/guide/voiceover/welcome/mac) |
| Windows | NVDA (free) | Chrome, Firefox | [nvaccess.org](https://www.nvaccess.org/), [WebAIM: NVDA](https://webaim.org/articles/nvda/) |
| Windows | JAWS (commercial) | Chrome, Edge | [Freedom Scientific](https://www.freedomscientific.com/products/software/jaws/), [WebAIM: JAWS](https://webaim.org/articles/jaws/) |
| Windows | Narrator (built in) | Edge | [Microsoft Narrator guide](https://support.microsoft.com/en-us/windows/complete-guide-to-narrator-e4397a0d-ef4f-b386-d8ae-c172f109bdb1) |
| Android | TalkBack (built in) | Chrome | [Android TalkBack help](https://support.google.com/accessibility/android/answer/6283677) |

Screen-reader usage data: [WebAIM Screen Reader User Survey](https://webaim.org/projects/screenreadersurvey10/). Annual home-page audit: [WebAIM Million](https://webaim.org/projects/million/).

## Learning

[W3C WAI tutorials](https://www.w3.org/WAI/tutorials/), [W3C WAI course: Digital Accessibility Foundations](https://www.w3.org/WAI/courses/foundations-course/), [WebAIM articles](https://webaim.org/articles/), [The A11Y Project checklist](https://www.a11yproject.com/checklist/), [MDN accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility), [web.dev Learn Accessibility](https://web.dev/learn/accessibility), [Inclusive Components (Heydon Pickering)](https://inclusive-components.design/), [GOV.UK accessibility blog](https://accessibility.blog.gov.uk/), [Sara Soueidan](https://www.sarasoueidan.com/), [Adrian Roselli](https://adrianroselli.com/), [Scott O'Hara](https://www.scottohara.me/), [Léonie Watson / TetraLogical](https://tetralogical.com/blog/), [Deque University](https://dequeuniversity.com/), [IAAP certifications (CPACC, WAS)](https://www.accessibilityassociation.org/certification).
