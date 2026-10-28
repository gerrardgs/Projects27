"""Minimal JSON HTTP service using only the Python standard library (3.11+).

Run:   PORT=3000 python3 app.py
Test:  python3 -m unittest -v
"""

from __future__ import annotations

import json
import logging
import os
import re
import signal
import threading
import uuid
from dataclasses import asdict, dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import unquote, urlsplit

MAX_BODY_BYTES = 16 * 1024
MAX_NAME_LENGTH = 200
MAX_EMAIL_LENGTH = 254
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
USER_PATH_PATTERN = re.compile(r"^/users/([^/]+)$")

logger = logging.getLogger("python_http_service")


@dataclass(frozen=True, slots=True)
class NewUser:
    name: str
    email: str


@dataclass(frozen=True, slots=True)
class User:
    id: str
    name: str
    email: str


class UserStore:
    """In-memory store, locked because ThreadingHTTPServer runs handlers concurrently."""

    def __init__(self) -> None:
        self._users: dict[str, User] = {}
        self._lock = threading.Lock()

    def create(self, new_user: NewUser) -> User:
        user = User(id=str(uuid.uuid4()), name=new_user.name, email=new_user.email)
        with self._lock:
            self._users[user.id] = user
        return user

    def find_by_id(self, user_id: str) -> User | None:
        with self._lock:
            return self._users.get(user_id)


def parse_new_user(payload: object) -> NewUser | list[str]:
    """Pure validation: returns a NewUser, or the list of problems found."""
    if not isinstance(payload, dict):
        return ["body must be a JSON object"]

    name = payload.get("name")
    email = payload.get("email")
    errors: list[str] = []

    if not isinstance(name, str) or not name.strip():
        errors.append("name is required")
    elif len(name) > MAX_NAME_LENGTH:
        errors.append(f"name must be at most {MAX_NAME_LENGTH} characters")

    if not isinstance(email, str) or not EMAIL_PATTERN.fullmatch(email):
        errors.append("email must be a valid address")
    elif len(email) > MAX_EMAIL_LENGTH:
        errors.append(f"email must be at most {MAX_EMAIL_LENGTH} characters")

    if errors or not isinstance(name, str) or not isinstance(email, str):
        return errors
    return NewUser(name=name.strip(), email=email.lower())


class RequestError(Exception):
    """An expected client error that maps directly to an HTTP response."""

    def __init__(self, status: HTTPStatus, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


class AppServer(ThreadingHTTPServer):
    """HTTP server that carries the application's dependencies for its handlers."""

    def __init__(self, address: tuple[str, int], store: UserStore) -> None:
        super().__init__(address, RequestHandler)
        self.store = store


class RequestHandler(BaseHTTPRequestHandler):
    server_version = "python-http-service"
    sys_version = ""

    def do_GET(self) -> None:  # noqa: N802 - method name is fixed by BaseHTTPRequestHandler
        self._dispatch("GET")

    def do_POST(self) -> None:  # noqa: N802 - method name is fixed by BaseHTTPRequestHandler
        self._dispatch("POST")

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        logger.info("%s %s", self.address_string(), format % args)

    @property
    def store(self) -> UserStore:
        if not isinstance(self.server, AppServer):
            raise TypeError("RequestHandler must be served by AppServer")
        return self.server.store

    def _dispatch(self, method: str) -> None:
        try:
            self._route(method, urlsplit(self.path).path)
        except RequestError as error:
            self.close_connection = True
            self._send_json(error.status, {"error": error.message})
        except Exception:
            logger.exception("unhandled request error")
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Internal error"})

    def _route(self, method: str, path: str) -> None:
        if path == "/health":
            self._send_json(HTTPStatus.OK, {"status": "ok"})
            return
        if path == "/users":
            self._handle_users(method)
            return
        match = USER_PATH_PATTERN.fullmatch(path)
        if match:
            self._handle_user(method, unquote(match.group(1)))
            return
        self._send_json(HTTPStatus.NOT_FOUND, {"error": "Route not found"})

    def _handle_users(self, method: str) -> None:
        if not self._method_allowed(method, "POST"):
            return
        result = parse_new_user(self._read_json_body())
        if isinstance(result, list):
            body = {"error": "Validation failed", "details": result}
            self._send_json(HTTPStatus.BAD_REQUEST, body)
            return
        self._send_json(HTTPStatus.CREATED, asdict(self.store.create(result)))

    def _handle_user(self, method: str, user_id: str) -> None:
        if not self._method_allowed(method, "GET"):
            return
        user = self.store.find_by_id(user_id)
        if user is None:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "User not found"})
            return
        self._send_json(HTTPStatus.OK, asdict(user))

    def _method_allowed(self, method: str, allowed: str) -> bool:
        """Send 405 and return False when the method does not match."""
        if method == allowed:
            return True
        self._send_json(
            HTTPStatus.METHOD_NOT_ALLOWED,
            {"error": "Method not allowed"},
            {"Allow": allowed},
        )
        return False

    def _read_json_body(self) -> object:
        content_type = self.headers.get("Content-Type", "")
        if not content_type.lower().startswith("application/json"):
            raise RequestError(
                HTTPStatus.UNSUPPORTED_MEDIA_TYPE, "Content-Type must be application/json"
            )
        length = self._content_length()
        try:
            return json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise RequestError(HTTPStatus.BAD_REQUEST, "Body is not valid JSON") from None

    def _content_length(self) -> int:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise RequestError(HTTPStatus.BAD_REQUEST, "Invalid Content-Length") from None
        if length < 0:
            raise RequestError(HTTPStatus.BAD_REQUEST, "Invalid Content-Length")
        if length > MAX_BODY_BYTES:
            raise RequestError(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                f"Request body exceeds {MAX_BODY_BYTES} bytes",
            )
        return length

    def _send_json(
        self,
        status: HTTPStatus,
        body: object,
        headers: dict[str, str] | None = None,
    ) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("X-Content-Type-Options", "nosniff")
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(payload)


def create_server(store: UserStore, host: str = "127.0.0.1", port: int = 0) -> AppServer:
    return AppServer((host, port), store)


def read_port(raw_port: str | None) -> int:
    message = f'PORT must be an integer between 0 and 65535, got "{raw_port}"'
    try:
        port = int(raw_port if raw_port is not None else "3000")
    except ValueError:
        raise SystemExit(message) from None
    if not 0 <= port <= 65535:
        raise SystemExit(message)
    return port


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    host = os.environ.get("HOST", "127.0.0.1")
    server = create_server(UserStore(), host=host, port=read_port(os.environ.get("PORT")))

    def shutdown(signum: int, _frame: object) -> None:
        logger.info("shutting down on signal %s", signal.Signals(signum).name)
        # server.shutdown() waits for serve_forever() to return; call it off this thread.
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)
    logger.info("listening on port %d", server.server_address[1])
    with server:
        server.serve_forever()


if __name__ == "__main__":
    main()
