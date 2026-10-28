# Machine learning tooling

Names and licences checked on PyPI on 2026-10-15. Prefer what the project already uses.

| Task | Options |
| :--- | :--- |
| Classical ML, pipelines, metrics | scikit-learn |
| Gradient-boosted trees (strong tabular baselines) | XGBoost, LightGBM, CatBoost |
| Deep learning | PyTorch (`torch`, `torchvision`), JAX, TensorFlow, Keras 3 (multi-backend) |
| Pretrained models, fine-tuning | Hugging Face `transformers`, `datasets`, `accelerate`, `peft` (parameter-efficient fine-tuning), `timm` (vision backbones), `sentence-transformers` (embeddings) |
| Experiment tracking and model registry | MLflow, Weights & Biases (`wandb`) |
| Data and pipeline versioning | DVC |
| Hyperparameter search | Optuna |
| Statistics and time series | statsmodels, SciPy |
| Fairness and explainability | Fairlearn, SHAP |
| Data validation for DataFrames | pandera |
| Monitoring and drift | Evidently |
| Model exchange and portable inference | ONNX, ONNX Runtime |
| Distributed training and tuning | Ray, PyTorch distributed, `accelerate` |
| Feature store | Feast |

## Editor support (VS Code extension IDs, checked on the Marketplace)

`ms-toolsai.jupyter`, `ms-toolsai.datawrangler`, `ms-python.python`, `ms-python.vscode-pylance`, `charliermarsh.ruff`.

## Practical notes

- Notebooks are for exploration. Move code that trains or serves a model into modules with tests; strip notebook outputs before committing (`nbstripout`).
- Pin the framework version and the CUDA or accelerator runtime together; GPU drivers, CUDA and framework builds must match.
- Large artefacts (datasets, checkpoints) belong in object storage, DVC or a model registry, not in Git.
