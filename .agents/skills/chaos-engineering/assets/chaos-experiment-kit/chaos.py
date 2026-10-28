"""A minimal chaos experiment runner, using only the standard library.

It follows the Principles of Chaos Engineering (https://principlesofchaos.org/) and the experiment
model of Chaos Toolkit (https://chaostoolkit.org/reference/api/experiment/):

1. Check the steady-state hypothesis. If the system is not in its steady state, bail out and
   inject nothing: an experiment on a system that is already unhealthy teaches nothing.
2. Inject the fault, then sample the steady state and the stop conditions until the duration ends.
   A violated stop condition (a guardrail) ends the run at once.
3. Always roll back, even after an error or an interrupt; a failed rollback is recorded, not hidden.
4. Check the steady state again to verify recovery.
5. Return a journal that records what happened, for the experiment log.
"""

from __future__ import annotations

import json
import time
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from enum import StrEnum


@dataclass(frozen=True, slots=True)
class Tolerance:
    """The range of values that counts as normal. A missing bound is unbounded."""

    minimum: float | None = None
    maximum: float | None = None

    def __post_init__(self) -> None:
        if self.minimum is None and self.maximum is None:
            raise ValueError("a tolerance needs at least one bound")
        if self.minimum is not None and self.maximum is not None and self.minimum > self.maximum:
            raise ValueError("minimum must not exceed maximum")

    def contains(self, value: float) -> bool:
        above_minimum = self.minimum is None or value >= self.minimum
        below_maximum = self.maximum is None or value <= self.maximum
        return above_minimum and below_maximum


@dataclass(frozen=True, slots=True)
class Probe:
    """A measurement of the system's observable output, with the range that counts as normal."""

    name: str
    measure: Callable[[], float]
    tolerance: Tolerance


@dataclass(frozen=True, slots=True)
class Experiment:
    title: str
    hypothesis: str
    steady_state: tuple[Probe, ...]
    inject: Callable[[], None]
    rollback: Callable[[], None]
    stop_conditions: tuple[Probe, ...] = ()
    duration_seconds: float = 5.0
    sample_interval_seconds: float = 1.0

    def __post_init__(self) -> None:
        if not self.steady_state:
            raise ValueError("an experiment needs at least one steady-state probe")
        if self.duration_seconds <= 0 or self.sample_interval_seconds <= 0:
            raise ValueError("duration and sample interval must be positive")


class Outcome(StrEnum):
    HELD = "hypothesis held"
    DISPROVED = "hypothesis disproved"
    ABORTED = "aborted"
    NOT_RUN = "not run: system was not in its steady state"


@dataclass(frozen=True, slots=True)
class Observation:
    phase: str
    probe: str
    value: float | None
    within_tolerance: bool
    error: str | None = None


@dataclass(slots=True)
class Journal:
    title: str
    hypothesis: str
    started_at: str
    outcome: Outcome = Outcome.HELD
    reasons: list[str] = field(default_factory=list)
    observations: list[Observation] = field(default_factory=list)
    rollback_error: str | None = None
    ended_at: str | None = None

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)


Clock = Callable[[], float]
Sleep = Callable[[float], None]


def run_experiment(
    experiment: Experiment, *, clock: Clock = time.monotonic, sleep: Sleep = time.sleep
) -> Journal:
    """Runs one experiment and returns its journal. Never leaves the fault injected."""
    journal = Journal(experiment.title, experiment.hypothesis, _now())
    if not _all_within(journal, "before", experiment.steady_state):
        journal.outcome = Outcome.NOT_RUN
        journal.ended_at = _now()
        return journal
    try:
        experiment.inject()
        _sample_until_done(experiment, journal, clock, sleep)
    except Exception as error:
        # Any failure of the injector or a probe ends the run; it is recorded, never swallowed.
        _fail(journal, Outcome.ABORTED, f"fault injection failed: {error!r}")
    finally:
        _roll_back(experiment, journal)
    if not _all_within(journal, "after", experiment.steady_state):
        _fail(journal, Outcome.DISPROVED, "the steady state did not recover after rollback")
    journal.ended_at = _now()
    return journal


def _sample_until_done(
    experiment: Experiment, journal: Journal, clock: Clock, sleep: Sleep
) -> None:
    deadline = clock() + experiment.duration_seconds
    while True:
        if not _all_within(journal, "guardrail", experiment.stop_conditions):
            _fail(journal, Outcome.ABORTED, "a stop condition was reached")
            return
        if not _all_within(journal, "during", experiment.steady_state):
            _fail(
                journal, Outcome.DISPROVED, "the steady state deviated while the fault was active"
            )
        if clock() >= deadline:
            return
        sleep(experiment.sample_interval_seconds)


def _all_within(journal: Journal, phase: str, probes: tuple[Probe, ...]) -> bool:
    observations = [_observe(phase, probe) for probe in probes]
    journal.observations.extend(observations)
    return all(observation.within_tolerance for observation in observations)


def _observe(phase: str, probe: Probe) -> Observation:
    try:
        value = probe.measure()
    except Exception as error:
        # A probe that cannot measure is outside tolerance: fail closed.
        return Observation(phase, probe.name, None, within_tolerance=False, error=repr(error))
    return Observation(phase, probe.name, value, probe.tolerance.contains(value))


def _roll_back(experiment: Experiment, journal: Journal) -> None:
    try:
        experiment.rollback()
    except Exception as error:
        journal.rollback_error = repr(error)
        _fail(journal, Outcome.ABORTED, "rollback failed: restore the system manually")


_SEVERITY = {Outcome.HELD: 0, Outcome.DISPROVED: 1, Outcome.ABORTED: 2, Outcome.NOT_RUN: 3}


def _fail(journal: Journal, outcome: Outcome, reason: str) -> None:
    if reason not in journal.reasons:
        journal.reasons.append(reason)
    if _SEVERITY[outcome] > _SEVERITY[journal.outcome]:
        journal.outcome = outcome


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")
