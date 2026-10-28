"""Leakage-safe, reproducible baseline for a tabular classification problem.

The pattern, not the dataset, is the point: split once, keep the test set untouched until the end,
fit every preprocessing step inside a Pipeline (so cross-validation never sees test data), compare
against a trivial baseline, and record everything needed to reproduce the result.

Run:   python baseline.py            (prints a JSON report)
Test:  python -m unittest -v
Needs: scikit-learn (see requirements.txt); the dataset ships with scikit-learn, no download.
"""

from __future__ import annotations

import json
import platform
from dataclasses import asdict, dataclass

import sklearn
from sklearn.datasets import load_breast_cancer
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, f1_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler

RANDOM_SEED = 42
TEST_FRACTION = 0.2
CV_FOLDS = 5


@dataclass(frozen=True)
class Report:
    dataset: str
    n_train: int
    n_test: int
    cv_roc_auc_mean: float
    cv_roc_auc_std: float
    baseline_test_roc_auc: float
    model_test_roc_auc: float
    model_test_average_precision: float
    model_test_f1: float
    random_seed: int
    sklearn_version: str
    python_version: str


def build_model() -> Pipeline:
    """Preprocessing lives inside the pipeline, so it is re-fitted on each training fold only."""
    return make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))


def run(seed: int = RANDOM_SEED) -> Report:
    features, target = load_breast_cancer(return_X_y=True)
    x_train, x_test, y_train, y_test = train_test_split(
        features, target, test_size=TEST_FRACTION, stratify=target, random_state=seed
    )

    # Model selection uses the training set only.
    folds = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=seed)
    cv_scores = cross_validate(build_model(), x_train, y_train, cv=folds, scoring="roc_auc")[
        "test_score"
    ]

    baseline = DummyClassifier(strategy="prior").fit(x_train, y_train)
    model = build_model().fit(x_train, y_train)

    # The test set is used exactly once, after all choices are fixed.
    model_scores = model.predict_proba(x_test)[:, 1]
    baseline_scores = baseline.predict_proba(x_test)[:, 1]
    return Report(
        dataset="sklearn breast_cancer",
        n_train=len(y_train),
        n_test=len(y_test),
        cv_roc_auc_mean=round(float(cv_scores.mean()), 4),
        cv_roc_auc_std=round(float(cv_scores.std()), 4),
        baseline_test_roc_auc=round(float(roc_auc_score(y_test, baseline_scores)), 4),
        model_test_roc_auc=round(float(roc_auc_score(y_test, model_scores)), 4),
        model_test_average_precision=round(float(average_precision_score(y_test, model_scores)), 4),
        model_test_f1=round(float(f1_score(y_test, model.predict(x_test))), 4),
        random_seed=seed,
        sklearn_version=sklearn.__version__,
        python_version=platform.python_version(),
    )


if __name__ == "__main__":
    print(json.dumps(asdict(run()), indent=2))
