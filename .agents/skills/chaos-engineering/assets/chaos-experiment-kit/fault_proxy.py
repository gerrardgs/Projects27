"""A TCP proxy that injects network faults between a client and one dependency.

It works like a very small Toxiproxy (https://github.com/Shopify/toxiproxy): point the client at the
proxy instead of the dependency, then add latency or drop connections while an experiment runs.
Faults apply only to traffic through this proxy, which keeps the blast radius to one client and one
dependency. It listens on 127.0.0.1 by default; do not expose it on a public interface.
"""

from __future__ import annotations

import random
import selectors
import socket
import socketserver
import threading
import time
from dataclasses import dataclass
from types import TracebackType

BUFFER_SIZE = 64 * 1024
CONNECT_TIMEOUT_SECONDS = 5.0
IDLE_TIMEOUT_SECONDS = 30.0

Address = tuple[str, int]


@dataclass(frozen=True, slots=True)
class Faults:
    """Faults applied to each new connection. The default is no fault."""

    latency_seconds: float = 0.0
    drop_probability: float = 0.0

    def __post_init__(self) -> None:
        if self.latency_seconds < 0:
            raise ValueError("latency_seconds must not be negative")
        if not 0.0 <= self.drop_probability <= 1.0:
            raise ValueError("drop_probability must be between 0 and 1")


NO_FAULTS = Faults()


class FaultProxy:
    """Forwards TCP connections from a local port to `upstream`, applying the current faults."""

    def __init__(
        self, upstream: Address, listen: Address = ("127.0.0.1", 0), seed: int | None = None
    ) -> None:
        self._upstream = upstream
        self._faults = NO_FAULTS
        self._lock = threading.Lock()
        # Fault sampling only needs to be reproducible, not unpredictable.
        self._random = random.Random(seed)  # noqa: S311  # nosec B311 - not used for security
        self._server = _Server(listen, _ConnectionHandler, self)
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)

    @property
    def address(self) -> Address:
        host, port = self._server.server_address[:2]
        return str(host), port

    def set_faults(self, faults: Faults) -> None:
        with self._lock:
            self._faults = faults

    def clear_faults(self) -> None:
        self.set_faults(NO_FAULTS)

    def start(self) -> None:
        self._thread.start()

    def stop(self) -> None:
        self._server.shutdown()
        self._server.server_close()
        self._thread.join(timeout=2.0)

    def __enter__(self) -> FaultProxy:
        self.start()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self.stop()

    def _decide(self) -> tuple[bool, float]:
        """Returns (drop the connection, latency to add) for a new connection."""
        with self._lock:
            faults = self._faults
            drop = self._random.random() < faults.drop_probability
        return drop, faults.latency_seconds

    def relay(self, client: socket.socket) -> None:
        """Handles one client connection: drop it, or delay it and forward it to the upstream."""
        drop, latency = self._decide()
        if drop:
            return
        if latency > 0:
            time.sleep(latency)
        with socket.create_connection(self._upstream, timeout=CONNECT_TIMEOUT_SECONDS) as upstream:
            _pipe(client, upstream)


class _Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(
        self, listen: Address, handler: type[_ConnectionHandler], proxy: FaultProxy
    ) -> None:
        self.proxy = proxy
        super().__init__(listen, handler)


class _ConnectionHandler(socketserver.BaseRequestHandler):
    server: _Server
    request: socket.socket

    def handle(self) -> None:
        try:
            self.server.proxy.relay(self.request)
        except OSError:
            # The dependency refused or reset the connection; the client sees a closed socket,
            # which is the real-world failure being simulated.
            return


def _pipe(client: socket.socket, upstream: socket.socket) -> None:
    """Copies bytes both ways until either side closes or the connection is idle too long."""
    peers = {client: upstream, upstream: client}
    with selectors.DefaultSelector() as selector:
        for sock in peers:
            selector.register(sock, selectors.EVENT_READ)
        while True:
            ready = selector.select(timeout=IDLE_TIMEOUT_SECONDS)
            if not ready:
                return
            for key, _ in ready:
                source = key.fileobj
                if not isinstance(source, socket.socket):
                    return
                data = source.recv(BUFFER_SIZE)
                if not data:
                    return
                peers[source].sendall(data)
