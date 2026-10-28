# UI Slop Patterns

A diagnostic scan, not a ban list. One pattern on its own is fine when it serves a written purpose; slop is many of them together with no reason. The exceptions are the hard gates in the skill's section 4 (fabricated content, dead controls, accessibility, states, mobile, themes), which always fail. Adapted from [antislop](https://github.com/miqdadbadjuber/anti-slop) (MIT, v3.2.21).

## Contents

- Visual and colour
- Layout and components
- Decoration
- Apps and dashboards
- Motion
- Identity

## Visual and colour

| Pattern | Telltale signs | Keep it only when |
| :--- | :--- | :--- |
| Default gradient | Blue to purple, blue to cyan or purple to pink, a full-page coloured glow | It is the brand's colour, or it marks one level of hierarchy |
| Glass everywhere | Blur on the navigation, cards, dialogs and sidebar at once | One or two elements, for layering that needs it |
| Pills everywhere | Every button, input, card, badge and dialog fully rounded | Radius varies by role, from the design system |
| Floating page | A large soft shadow on every component | Shadow marks real elevation (menus, dialogs) |
| Glow everywhere | Glow on cards, buttons, icons, badges, backgrounds and borders | One focus accent on one or two elements |
| Background grid | Squares, blueprint lines, dot grids | The texture belongs to the product's identity |
| Dark by default | The whole page is dark because it "looks tech" | The audience or product type has a reason (developer tools, media) or users can switch |
| Too many colours | Five to seven colours with no system | Two or three core colours plus one accent |
| Accent everywhere | One accent colour on buttons, icons, badges, links and lines | The accent marks the key moment only |
| Sterile default | White page, thin grey borders, small radius, generic font, no identity | Never as the result: this is the empty space a filter leaves without direction |
| Skeleton as product shot | Grey placeholder bars shown as the product screenshot | Never: show the real product or nothing |

## Layout and components

| Pattern | Telltale signs |
| :--- | :--- |
| Template landing page | Hero, subtitle, two buttons, screenshot, feature grid, testimonials, FAQ, call to action, footer, in that order |
| Copy-paste feature cards | Identical size, icon, layout and padding for every card |
| Bento mosaic by default | A grid of differently sized cards as the section layout, whatever the content |
| Fake terminal | A styled terminal with typed commands as the hero visual |
| Uniform spacing and rhythm | Every section the same: centred title, subtitle, identical cards; only the background alternates |
| Three-step "how it works" | Round icon, numbers 1 2 3, short text, always three |
| "Trusted by" logo bar | A row of company logos under the hero (and a hard-gate failure if the logos are not real customers) |
| Three pricing columns | Always three tiers with the middle one marked "Most popular", whatever the real pricing |
| Four-column footer | Product, Company, Resources, Legal with no variation |
| Demo without a product | A product that is never shown working; no terms or privacy policy |

## Decoration

| Pattern | Telltale signs |
| :--- | :--- |
| Generic AI icons | Sparkles, stars, magic wands, lightning, diamonds, cubes, robots, orbs as feature icons |
| One library's default look | Every icon from the same thin-stroke rounded set because it is the default, not because it fits |
| Emoji as decoration | Rockets in headlines, ticks beside every bullet, fire on calls to action |
| Arrows on every button | `→` or `↗` as decoration on almost every button |
| Coloured left stripe | A thin coloured bar on the left of cards or rows that marks no state |
| Capsule badges | Pill, thin border, glow, dot and capitals holding "AI powered", "Beta", "New" |
| Eyebrow pill above the headline | A small pill above the H1 repeating what the headline says |
| Decorative status dot | A glowing, pulsing dot beside a heading that marks no live state |
| Generic AI typography | Large monospace headings, capitals with wide tracking ("HOW IT WORKS") |
| Stock illustrations | Generic illustration libraries or 3D blob characters with no link to the product |

## Apps and dashboards

| Pattern | Fix |
| :--- | :--- |
| Default dashboard shell (sidebar, top bar, four stat cards, a chart, a table) chosen before anyone asked what the screen is for | Name the screen's job and the one decision the user makes there; build the hierarchy around it |
| Stat cards with invented numbers and "+12% this week" deltas | Real numbers or none; a delta only with a real, named comparison period; placeholders labelled as such |
| Activity feed with rotating fake names and avatars | Real events, or an honest empty state that says what to do first |
| Chart placed to fill space ("Overview") | Write the question the chart answers into its title, or replace it with a sentence ([data-visualization-design](../../data-visualization-design/SKILL.md)) |
| Generic table columns (Name, Status, Date, Actions) with a menu on every row | Columns chosen from the decision the table supports; menus hold only actions that exist |
| Fields filled with "John Doe" and plausible fake data | Empty fields, or placeholders that say what goes there |
| "No data available" with an illustration, a bare spinner | Empty states say why and give the one action; loading says what is loading; errors say what failed and what to do |

## Motion

| Pattern | Fix |
| :--- | :--- |
| Elements that pulse, bounce or float forever | Motion has a trigger and a purpose; nothing loops without one; reduced-motion users get none ([motion-and-interaction](../../motion-and-interaction/SKILL.md)) |
| Fade-up, fade-in, float, scale and bounce on every element | Choreograph to the declared motion dial: the key element moves, the rest stays calm |

## Identity

| Pattern | Test |
| :--- | :--- |
| No visual identity | Swap the name and logo: if it still fits another product, it is generic |
| Clone of a famous product | Looks like a well-known product's site without being asked; use references as inspiration, never as a template |
