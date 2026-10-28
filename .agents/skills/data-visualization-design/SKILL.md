---
name: data-visualization-design
description: Design and build charts, dashboards and infographics that are accurate, readable and accessible - choosing the chart type for the question, honest axes and scales, colour palettes for categories, sequences and divergence, labelling, responsive and dark-mode charts, accessible alternatives, and implementation with D3, Observable Plot, Vega-Lite, Chart.js, ECharts or Recharts. Use when asked to visualise data, design a dashboard or KPI view, pick a chart type or chart colours, or fix a misleading or unreadable chart.
license: MIT
metadata:
  version: "1.0.0"
---

# Data Visualisation Design

A chart answers a question. Start from the question and the audience, not from the chart type.

## 1. Pick the form for the question

| Question | Usually best | Avoid |
| :--- | :--- | :--- |
| Compare categories | Bar chart (horizontal for long labels), dot plot | 3D bars, pie with many slices |
| Change over time | Line chart; column chart for few discrete periods | Unevenly spaced time on a categorical axis |
| Part of a whole | Stacked bar, 100 percent bar; a pie or donut only for two or three parts | Several pies to compare |
| Distribution | Histogram, box plot, strip or beeswarm plot | Averages alone |
| Relationship | Scatter plot (with trend line if justified) | Dual-axis charts that imply correlation |
| Ranking | Sorted bar chart, slope chart | Unsorted bars |
| Geography | Choropleth with normalised rates; symbol map for counts | Raw counts on a choropleth |
| A single key number | Stat tile with comparison and trend (sparkline) | A gauge |

References: [Financial Times Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary), [Data Viz Project](https://datavizproject.com/), [From Data to Viz](https://www.data-to-viz.com/).

## 2. Honest encoding

- Bar charts start at zero. Line charts may zoom in but label the axis clearly.
- Same scale when charts are compared side by side; say when they differ.
- Normalise when comparing groups of different sizes (per capita, percentage).
- Show uncertainty (ranges, confidence intervals) where it exists. Cite the data source and date on the chart.
- Never fabricate or "illustrate" data. Placeholder data in mockups must be labelled as such.

## 3. Colour

- Categorical: a few distinct hues (about six or fewer), consistent meaning across the product. Sequential: one hue from light to dark for ordered values. Diverging: two hues around a meaningful midpoint.
- Use perceptually uniform, colour-blind-friendly palettes: [ColorBrewer](https://colorbrewer2.org/), [Viridis](https://cran.r-project.org/web/packages/viridis/vignettes/intro-to-viridis.html), [Datawrapper's guide to colours](https://www.datawrapper.de/academy/what-to-consider-when-choosing-colors-for-data-visualization).
- Do not rely on colour alone: direct labels, patterns, shapes, or position. Chart marks need 3:1 contrast against the background (WCAG 1.4.11) when they carry meaning.
- Define chart colours as tokens with light and dark variants.

## 4. Readability

- Direct labels instead of legends where possible; descriptive title that states the takeaway ("Sign-ups doubled after the redesign"); units on axes; readable font sizes at the real display size; minimal gridlines.
- Responsive: simplify on small screens (fewer ticks, horizontal bars, stacked small multiples) rather than shrinking.
- Dashboards: the most important metrics top-left, grouped by question, consistent time ranges and filters, clear "as of" timestamps, empty and error states.

## 5. Accessibility

- Provide a text summary of the insight and access to the underlying data (a table or download).
- SVG charts: `role="img"` with an accessible name and description for static charts, or an accessible table; interactive charts need keyboard access to data points and announced values.
- Respect reduced motion for animated transitions.
- Guidance: [W3C WAI complex images tutorial](https://www.w3.org/WAI/tutorials/images/complex/), [Chartability](https://chartability.github.io/POUR-CAF/), [Highcharts accessibility module docs](https://www.highcharts.com/docs/accessibility/accessibility-module).

## 6. Libraries (latest npm versions on 2026-10-15)

| Library | Version | Strength | Docs |
| :--- | :--- | :--- | :--- |
| D3 (`d3`) | 7.9.0 | Full control, custom visuals | [d3js.org](https://d3js.org/) |
| Observable Plot (`@observablehq/plot`) | 0.6.17 | Concise exploratory and editorial charts | [observablehq.com/plot](https://observablehq.com/plot/) |
| Vega-Lite (`vega-lite`) | 6.5.0 | Declarative grammar, JSON specs | [vega.github.io/vega-lite](https://vega.github.io/vega-lite/) |
| Chart.js (`chart.js`) | 4.5.1 | Simple canvas charts | [chartjs.org](https://www.chartjs.org/docs/latest/) |
| Apache ECharts (`echarts`) | 6.1.0 | Large datasets, many chart types | [echarts.apache.org](https://echarts.apache.org/en/index.html) |
| Recharts (`recharts`) | 3.10.1 | React components | [recharts.org](https://recharts.org/) |
| Highcharts (`highcharts`) | 13.1.1 | Strong built-in accessibility; commercial licence | [highcharts.com](https://www.highcharts.com/) |

No-code: [Datawrapper](https://www.datawrapper.de/), [Flourish](https://flourish.studio/), [RAWGraphs](https://www.rawgraphs.io/), Tableau, Power BI, Looker Studio.

## 7. Reading

Edward Tufte, *The Visual Display of Quantitative Information*; Alberto Cairo, *How Charts Lie*; Cole Nussbaumer Knaflic, [Storytelling with Data](https://www.storytellingwithdata.com/); Claus Wilke, [Fundamentals of Data Visualization (free online)](https://clauswilke.com/dataviz/); [Datawrapper Academy](https://academy.datawrapper.de/).
