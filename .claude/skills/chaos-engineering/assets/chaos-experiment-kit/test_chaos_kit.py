"""Run with: python -m unittest -v"""

from __future__ import annotations

import dataclasses
import socket
import socketserver
import threading
import time
import unittest
from collections.abc import Callable, Generator
from contextlib import contextmanager
from typing import Any

from chaos import Experiment, Outcome, Probe, Tolerance, run_experiment
from example_experiment import PriceClient, run_all
from fault_proxy import FaultProxy, Faults


class FakeClock:
    """Time that moves only when the runner sleeps, so tests are fast and deterministic."""

    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now

    def sleep(self, seconds: float) -> None:
        self.now += seconds


class FakeSystem:
    """A system whose measured health drops while a fault is active and recovers on rollback."""

    def __init__(self, healthy: float = 1.0, degraded: float = 1.0) -> None:
        self.healthy = healthy
        self.degraded = degraded
        self.fault_active = False
        self.rollbacks = 0

    def health(self) -> float:
        return self.degraded if self.fault_active else self.healthy

    def inject(self) -> None:
        self.fault_active = True

    def rollback(self) -> None:
        self.fault_active = False
        self.rollbacks += 1


def experiment_for(system: FakeSystem, **overrides: Any) -> Experiment:
    base = Experiment(
        title="test",
        hypothesis="health stays at or above 0.9",
        steady_state=(Probe("health", system.health, Tolerance(minimum=0.9)),),
        inject=system.inject,
        rollback=system.rollback,
        duration_seconds=3.0,
        sample_interval_seconds=1.0,
    )
    return dataclasses.replace(base, **overrides)


def run(experiment: Experiment) -> tuple[Outcome, list[str]]:
    clock = FakeClock()
    journal = run_experiment(experiment, clock=clock, sleep=clock.sleep)
    return journal.outcome, journal.reasons


class ToleranceTest(unittest.TestCase):
    def test_bounds_are_inclusive_and_optional(self) -> None:
        self.assertTrue(Tolerance(minimum=0.9).contains(0.9))
        self.assertFalse(Tolerance(minimum=0.9).contains(0.89))
        self.assertTrue(Tolerance(maximum=0.5).contains(-1.0))
        self.assertFalse(Tolerance(0.0, 1.0).contains(1.01))

    def test_rejects_invalid_ranges(self) -> None:
        with self.assertRaises(ValueError):
            Tolerance()
        with self.assertRaises(ValueError):
            Tolerance(minimum=2.0, maximum=1.0)


class RunExperimentTest(unittest.TestCase):
    def test_hypothesis_holds_when_the_steady_state_survives_the_fault(self) -> None:
        system = FakeSystem(degraded=0.95)
        outcome, reasons = run(experiment_for(system))
        self.assertEqual(outcome, Outcome.HELD)
        self.assertEqual(reasons, [])
        self.assertEqual(system.rollbacks, 1)
        self.assertFalse(system.fault_active)

    def test_hypothesis_is_disproved_when_the_steady_state_deviates(self) -> None:
        system = FakeSystem(degraded=0.5)
        outcome, reasons = run(experiment_for(system))
        self.assertEqual(outcome, Outcome.DISPROVED)
        self.assertIn("the steady state deviated while the fault was active", reasons)
        self.assertFalse(system.fault_active)

    def test_bails_out_without_injecting_when_not_in_steady_state(self) -> None:
        system = FakeSystem(healthy=0.5)
        outcome, _ = run(experiment_for(system))
        self.assertEqual(outcome, Outcome.NOT_RUN)
        self.assertEqual(system.rollbacks, 0)
        self.assertFalse(system.fault_active)

    def test_stop_condition_aborts_and_rolls_back(self) -> None:
        system = FakeSystem(degraded=0.1)
        guardrail = (Probe("health floor", system.health, Tolerance(minimum=0.5)),)
        outcome, reasons = run(experiment_for(system, stop_conditions=guardrail))
        self.assertEqual(outcome, Outcome.ABORTED)
        self.assertIn("a stop condition was reached", reasons)
        self.assertFalse(system.fault_active)

    def test_rolls_back_when_injection_fails(self) -> None:
        system = FakeSystem()

        def broken_inject() -> None:
            system.inject()
            raise RuntimeError("injector crashed half way")

        outcome, reasons = run(experiment_for(system, inject=broken_inject))
        self.assertEqual(outcome, Outcome.ABORTED)
        self.assertTrue(any("fault injection failed" in reason for reason in reasons))
        self.assertFalse(system.fault_active)

    def test_rolls_back_on_interrupt(self) -> None:
        system = FakeSystem()

        def interrupting_sleep(_: float) -> None:
            raise KeyboardInterrupt

        with self.assertRaises(KeyboardInterrupt):
            run_experiment(experiment_for(system), sleep=interrupting_sleep)
        self.assertFalse(system.fault_active)

    def test_failed_rollback_is_reported(self) -> None:
        system = FakeSystem()

        def broken_rollback() -> None:
            raise RuntimeError("cannot restore")

        clock = FakeClock()
        journal = run_experiment(
            experiment_for(system, rollback=broken_rollback), clock=clock, sleep=clock.sleep
        )
        self.assertEqual(journal.outcome, Outcome.ABORTED)
        self.assertIn("cannot restore", journal.rollback_error or "")

    def test_a_probe_that_raises_counts_as_out_of_tolerance(self) -> None:
        def failing_probe() -> float:
            raise OSError("metrics backend down")

        system = FakeSystem()
        steady_state = (Probe("health", failing_probe, Tolerance(minimum=0.9)),)
        outcome, _ = run(experiment_for(system, steady_state=steady_state))
        self.assertEqual(outcome, Outcome.NOT_RUN)

    def test_journal_serializes_to_json(self) -> None:
        clock = FakeClock()
        journal = run_experiment(experiment_for(FakeSystem()), clock=clock, sleep=clock.sleep)
        self.assertIn('"outcome": "hypothesis held"', journal.to_json())

    def test_rejects_experiments_without_a_steady_state(self) -> None:
        with self.assertRaises(ValueError):
            experiment_for(FakeSystem(), steady_state=())


class _EchoHandler(socketserver.BaseRequestHandler):
    request: socket.socket

    def handle(self) -> None:
        try:
            data = self.request.recv(1024)
            if data:
                self.request.sendall(data)
        except OSError:
            pass


class _EchoServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


@contextmanager
def echo_server() -> Generator[tuple[str, int]]:
    server = _EchoServer(("127.0.0.1", 0), _EchoHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        host, port = server.server_address[:2]
        yield str(host), port
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2.0)


def round_trip(address: tuple[str, int], timeout: float = 2.0) -> bytes:
    with socket.create_connection(address, timeout=timeout) as connection:
        connection.sendall(b"ping")
        return connection.recv(1024)


def timed(action: Callable[[], object]) -> float:
    started = time.monotonic()
    action()
    return time.monotonic() - started


class FaultProxyTest(unittest.TestCase):
    def setUp(self) -> None:
        upstream = self.enterContext(echo_server())
        self.proxy = self.enterContext(FaultProxy(upstream, seed=7))

    def test_forwards_traffic_without_faults(self) -> None:
        self.assertEqual(round_trip(self.proxy.address), b"ping")

    def test_adds_latency(self) -> None:
        self.proxy.set_faults(Faults(latency_seconds=0.3))
        self.assertGreaterEqual(timed(lambda: round_trip(self.proxy.address)), 0.3)

    def test_drops_connections(self) -> None:
        self.proxy.set_faults(Faults(drop_probability=1.0))
        # Depending on timing, a dropped connection reaches the client as end of stream or as a
        # reset (the proxy closes with the client's bytes still unread). Both mean no reply.
        try:
            reply = round_trip(self.proxy.address)
        except ConnectionResetError:
            reply = b""
        self.assertEqual(reply, b"")

    def test_clearing_faults_restores_traffic(self) -> None:
        self.proxy.set_faults(Faults(drop_probability=1.0))
        self.proxy.clear_faults()
        self.assertEqual(round_trip(self.proxy.address), b"ping")

    def test_rejects_invalid_faults(self) -> None:
        with self.assertRaises(ValueError):
            Faults(drop_probability=1.5)
        with self.assertRaises(ValueError):
            Faults(latency_seconds=-1.0)


class NoFallbackPriceClient(PriceClient):
    def when_unavailable(self) -> str | None:
        return None


class ExampleExperimentTest(unittest.TestCase):
    def test_resilient_client_keeps_the_steady_state(self) -> None:
        self.assertEqual([journal.outcome for journal in run_all()], [Outcome.HELD, Outcome.HELD])

    def test_experiments_find_the_weakness_of_a_client_without_fallback(self) -> None:
        outcomes = [journal.outcome for journal in run_all(NoFallbackPriceClient)]
        self.assertNotIn(Outcome.HELD, outcomes)


if __name__ == "__main__":
    unittest.main()
