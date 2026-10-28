"""Run with: python -m unittest -v"""

from __future__ import annotations

import unittest

from baseline import build_model, run
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


class BaselineTest(unittest.TestCase):
    def test_is_reproducible_with_the_same_seed(self) -> None:
        self.assertEqual(run(seed=7), run(seed=7))

    def test_model_beats_the_trivial_baseline(self) -> None:
        report = run()
        self.assertAlmostEqual(report.baseline_test_roc_auc, 0.5, places=6)
        self.assertGreater(report.model_test_roc_auc, report.baseline_test_roc_auc + 0.2)

    def test_cross_validation_and_test_score_agree(self) -> None:
        # A large gap between validation and test scores is a symptom of leakage or overfitting.
        report = run()
        self.assertLess(abs(report.cv_roc_auc_mean - report.model_test_roc_auc), 0.05)

    def test_preprocessing_is_inside_the_pipeline(self) -> None:
        model = build_model()
        self.assertIsInstance(model, Pipeline)
        self.assertIsInstance(model.steps[0][1], StandardScaler)

    def test_split_sizes(self) -> None:
        report = run()
        self.assertEqual(report.n_train + report.n_test, 569)
        self.assertEqual(report.n_test, 114)


if __name__ == "__main__":
    unittest.main()
