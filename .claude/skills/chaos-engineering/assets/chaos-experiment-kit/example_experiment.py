"""A complete, local chaos experiment you can run and adapt: python example_experiment.py

The system under test is a client that reads a price from a dependency. It has a timeout and falls
back to the last known price, so users still get an answer when the dependency is slow or down.
Everything runs on 127.0.0.1; nothing outside this process is touched.

Steady state: at least 95% of requests get an answer within 300 ms.
Experiments: the dependency becomes slow (500 ms), then unreachable (every connection dropped).
Exit code 0 when every hypothesis held, 1 otherwise. The journals are printed as JSON.
"""

from __future__ import annotations

import http.client
import sys
import threading
import time
import urllib.error
import urllib.request
from collections.abc import Callable, Generator
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from chaos import Experiment, Journal, Outcome, Probe, Tolerance, run_experiment
from fault_proxy import FaultProxy, Faults

LATENCY_BUDGET_SECONDS = 0.3
CLIENT_TIMEOUT_SECONDS = 0.1
REQUESTS_PER_SAMPLE = 5


class PriceHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 - method name is fixed by BaseHTTPRequestHandler
        body = b"42.00"
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except ConnectionError:
            # Under injected latency the client has already timed out and closed the connection.
            return

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002 - signature is fixed
        return


class PriceClient:
    """Reads the price with a timeout; falls back to the last known price when the read fails."""

    def __init__(self, url: str, timeout_seconds: float) -> None:
        self._url = url
        self._timeout = timeout_seconds
        self._last_known: str | None = None

    def price(self) -> str | None:
        try:
            with urllib.request.urlopen(self._url, timeout=self._timeout) as response:  # noqa: S310  # nosec B310 - fixed local URL
                body = response.read()
                text = body.decode() if isinstance(body, bytes) else str(body)
                self._last_known = text
                return text
        except (urllib.error.URLError, http.client.HTTPException, TimeoutError, ConnectionError):
            return self.when_unavailable()

    def when_unavailable(self) -> str | None:
        """The graceful degradation: answer with the last known price."""
        return self._last_known


def answered_within_budget(client: PriceClient) -> Callable[[], float]:
    """Probe: the share of requests that got an answer within the latency budget."""

    def measure() -> float:
        answered = 0
        for _ in range(REQUESTS_PER_SAMPLE):
            started = time.monotonic()
            result = client.price()
            if result is not None and time.monotonic() - started <= LATENCY_BUDGET_SECONDS:
                answered += 1
        return answered / REQUESTS_PER_SAMPLE

    return measure


@contextmanager
def price_service() -> Generator[tuple[str, int]]:
    server = ThreadingHTTPServer(("127.0.0.1", 0), PriceHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        host, port = server.server_address[:2]
        yield str(host), port
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2.0)


def injector(proxy: FaultProxy, faults: Faults) -> Callable[[], None]:
    return lambda: proxy.set_faults(faults)


def experiments(proxy: FaultProxy, client: PriceClient) -> list[Experiment]:
    steady_state = (
        Probe("answered within 300 ms", answered_within_budget(client), Tolerance(minimum=0.95)),
    )
    # Guardrail: if almost nobody gets an answer, stop at once instead of finishing the run.
    stop_conditions = (
        Probe("answered at all", answered_within_budget(client), Tolerance(minimum=0.5)),
    )
    faults = {
        "dependency latency 500 ms": Faults(latency_seconds=0.5),
        "dependency unreachable": Faults(drop_probability=1.0),
    }
    return [
        Experiment(
            title=title,
            hypothesis="Requests still get an answer within 300 ms (timeout plus fallback).",
            steady_state=steady_state,
            inject=injector(proxy, fault),
            rollback=proxy.clear_faults,
            stop_conditions=stop_conditions,
            duration_seconds=2.0,
            sample_interval_seconds=0.5,
        )
        for title, fault in faults.items()
    ]


def run_all(client_type: type[PriceClient] = PriceClient) -> list[Journal]:
    with price_service() as upstream, FaultProxy(upstream, seed=1) as proxy:
        host, port = proxy.address
        client = client_type(f"http://{host}:{port}/price", CLIENT_TIMEOUT_SECONDS)
        return [run_experiment(experiment) for experiment in experiments(proxy, client)]


def main() -> int:
    journals = run_all()
    for journal in journals:
        print(journal.to_json())
    held = sum(journal.outcome is Outcome.HELD for journal in journals)
    print(f"{held} of {len(journals)} hypotheses held", file=sys.stderr)
    return 0 if held == len(journals) else 1


if __name__ == "__main__":
    sys.exit(main())
