---
name: data-analysis
description: Answer business and research questions with data correctly - SQL and DataFrame analysis (pandas, Polars, DuckDB), data cleaning, exploratory analysis, statistics and hypothesis testing, A/B test evaluation, metric definitions, visualization and reproducible notebooks or reports. Use when analysing a dataset, writing analytical SQL, computing metrics or KPIs, running or interpreting an experiment, building charts or dashboards, or checking whether a conclusion is statistically sound.
license: MIT
metadata:
  version: "1.0.0"
---

# Data Analysis

An analysis is only useful if its numbers are right, its method fits the question, and someone else can reproduce it.

## 1. Frame the question

- Write the question, the decision it informs, the metric that answers it, and what result would change the decision.
- Define every metric precisely: numerator, denominator, filters, time window, time zone, unit, and how duplicates, refunds, test accounts and missing values are treated. Reuse the organization's existing metric definitions when they exist.

## 2. Understand and clean the data

- Check grain (what one row means), keys and duplicates, row counts per period, nulls, ranges, units and categorical values before computing anything.
- Join carefully: confirm key uniqueness on each side; a many-to-many join silently multiplies rows. Compare row counts before and after every join.
- Keep raw data unchanged; express every cleaning step in code, not by hand-editing files.
- Watch time: store and compare in UTC, convert for display; beware daylight-saving gaps and partial periods at the edges of the window.

## 3. Analyse

- Start descriptive: distributions, not only means (medians, percentiles, histograms); segment by the dimensions that matter.
- Push heavy work to the database or DuckDB/Polars; pull only the aggregated result into memory.
- Correlation is not causation. State confounders you cannot rule out; prefer experiments for causal questions.
- Report uncertainty: confidence intervals or credible intervals, sample sizes, and effect sizes, not only p-values.

## 4. Experiments and statistical tests

- Decide the primary metric, minimum detectable effect, significance level and sample size **before** starting (power analysis). Do not stop early when the result "looks significant" unless the design uses a sequential method.
- Check the randomization: sample ratio mismatch (observed group sizes differing from the planned split) invalidates results.
- Pick a test that fits the data: t-test or Welch's t-test for means, chi-squared or Fisher's exact test for proportions in small samples, Mann-Whitney U for ordinal or skewed data, bootstrap when assumptions are doubtful (SciPy `scipy.stats`, statsmodels).
- Correct for multiple comparisons when testing many metrics or segments (for example Holm or Benjamini-Hochberg), or pre-register a single primary metric.
- Beware Simpson's paradox when aggregating across segments with different mixes.

## 5. Visualize and communicate

- Choose the chart for the comparison: lines for trends over time, bars for categories, histograms or box plots for distributions, scatter plots for relationships.
- Start bar-chart axes at zero; label axes with units; avoid dual axes and 3D effects; use colour-blind-safe palettes.
- Lead with the answer, then the evidence, then caveats and data limitations.

## 6. Reproducibility

- Analysis in version-controlled code: SQL files, scripts or notebooks (strip notebook outputs before committing with `nbstripout`, or use plain-text notebooks such as marimo).
- Pin library versions; record the data snapshot or query date; set random seeds.
- Re-run top to bottom from a clean environment before sharing results.

## Tools (names checked on PyPI on 2026-10-15)

pandas, Polars, DuckDB, PyArrow, SciPy, statsmodels, matplotlib, seaborn, Plotly, Vega-Altair, JupyterLab, marimo, `nbstripout`, `nbqa` (run Ruff and other linters on notebooks), SQLFluff (SQL linting). VS Code extension IDs: `ms-toolsai.jupyter`, `ms-toolsai.datawrangler`, `mechatroner.rainbow-csv`.

## Done when

- [ ] Metric definitions written and applied consistently
- [ ] Row counts checked after every join and filter
- [ ] Uncertainty and sample sizes reported; multiple comparisons handled
- [ ] The analysis re-runs from scratch and produces the same numbers
- [ ] Conclusions state their limitations
