---
name: machine-learning
description: Frame, build, evaluate, document and operate machine learning and deep learning models (classical ML, neural networks, time series, recommendation) with leakage-free data splits, honest baselines and metrics, reproducible experiments, fairness and explainability checks, and MLOps practices for deployment and monitoring. Use for data science and ML/DL work in scikit-learn, PyTorch, JAX, TensorFlow/Keras, XGBoost or LightGBM, including training, fine-tuning, hyperparameter tuning, experiment tracking, model cards and drift monitoring.
license: MIT
metadata:
  version: "1.0.0"
---

# Machine Learning and Deep Learning

Tool names checked on PyPI on 2026-10-15. A runnable, tested example of the core pattern is in [assets/baseline-classifier/](assets/baseline-classifier/) (scikit-learn 1.9.1; tests pass on Python 3.11, 3.13 and 3.14). Tooling by task: [references/tooling.md](references/tooling.md). For language models see [llm-applications](../llm-applications/SKILL.md); for images and video see [computer-vision](../computer-vision/SKILL.md); for serving see [ml-inference-serving](../ml-inference-serving/SKILL.md).

## 1. Frame the problem

- State the decision the model supports, the prediction target, the unit of prediction, and when the prediction is made (what information exists at that moment).
- Choose the metric from the cost of errors: precision versus recall, calibration, ranking quality, or error in business units. Accuracy is misleading on imbalanced data.
- Decide whether ML is needed: a rule or a heuristic may meet the goal. Measure it as the first baseline.

## 2. Data and splits (where most ML bugs live)

- **Leakage**: features must only use information available at prediction time. Remove target-derived fields, post-outcome timestamps and identifiers that encode the label.
- **Split before anything else.** Fit scalers, imputers, encoders, feature selection and resampling on training data only, inside a pipeline, so cross-validation never sees validation or test data.
- **Split by the structure of the data**: time-based splits for forecasting and anything temporal; group splits (for example by user or patient) when rows from the same entity would otherwise land in both sets; stratification for imbalanced classes.
- **Touch the test set once**, after all modelling choices are fixed. Use cross-validation or a separate validation set for tuning.
- Document datasets: source, collection period, labelling process, known biases, licence and personal-data status ("datasheets for datasets").

## 3. Model development

- Start with a trivial baseline (`DummyClassifier`, the mean, last value) and a simple model (linear model or gradient-boosted trees for tabular data) before deep learning.
- Change one thing at a time and track every experiment: code version, data version, parameters, metrics and artefacts (MLflow, Weights & Biases, or DVC for data and pipelines).
- Reproducibility: fix random seeds (Python, NumPy, framework), record library and hardware versions, and enable deterministic algorithms where the framework supports them; state when bitwise reproducibility is not possible (for example some GPU kernels).
- Hyperparameter search (for example Optuna) on validation folds only; report the variance across folds or seeds, not one lucky run.
- Deep learning: verify the pipeline by overfitting a tiny batch first; monitor training and validation curves; use early stopping, checkpointing, gradient clipping and mixed precision deliberately; check data loading is not the bottleneck.

## 4. Evaluate honestly

- Report metrics with uncertainty (cross-validation spread, bootstrap intervals) and against the baseline.
- Slice metrics by important segments (region, device, demographic groups where lawful and relevant); a good average can hide a failing segment.
- Check calibration when probabilities drive decisions.
- Error analysis: read the worst mistakes, not just the scores.
- Fairness: measure performance and selection-rate differences across groups (Fairlearn); document trade-offs. Explainability: use SHAP or permutation importance carefully, they describe the model, not causality.

## 5. Ship and operate (MLOps)

- Package the whole pipeline (preprocessing plus model) as one versioned artefact, with the training data version and metrics attached; export to ONNX when the serving stack needs it.
- Write a model card: intended use, out-of-scope uses, training data, metrics by segment, limitations and ethical considerations.
- Validate inputs at serving time against the training schema; reject or flag out-of-range values.
- Monitor in production: input data drift, prediction drift, and the real metric once labels arrive (Evidently and similar tools); alert and retrain by policy, not ad hoc.
- Roll out new models with shadow mode, canary or A/B tests, with a fast rollback to the previous model.

## 6. Responsible AI and regulation

- Follow the NIST AI Risk Management Framework (NIST AI 100-1) or the organization's AI policy; check whether the use case falls under specific law, for example the EU AI Act (Regulation (EU) 2024/1689) for high-risk systems.
- Personal data in training sets needs a lawful basis, minimization and protection ([06-security](../../rules/06-security.md)).

## Done when

- [ ] Split strategy matches the data's time and group structure; no preprocessing fitted outside the pipeline
- [ ] Model beats a trivial baseline on held-out data, with uncertainty reported
- [ ] Experiment fully reproducible from recorded code, data version, parameters and seed
- [ ] Segment metrics and fairness checks reviewed; model card written
- [ ] Serving input validation, monitoring and rollback defined
