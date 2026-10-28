"""Run with: python -m unittest -v"""

from __future__ import annotations

import base64
import json
import threading
import unittest
from collections.abc import Callable, Generator, Sequence
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import ClassVar

from http_client import ApiError, JsonApiClient, RetryPolicy, backoff_seconds, retry_after_seconds
from webhooks import SeenMessages, WebhookVerificationError, decode_secret, sign, verify

SECRET = "whsec_" + base64.b64encode(b"0123456789abcdef0123456789abcdef").decode()
NOW = 1_700_000_000

Script = Sequence[tuple[int, dict[str, str], object]]


def fixed_clock(moment: float) -> Callable[[], float]:
    return lambda: moment


def signed_headers(payload: bytes, message_id: str = "msg_1") -> dict[str, str]:
    timestamp = NOW
    signature = sign(decode_secret(SECRET), message_id, timestamp, payload)
    return {
        "webhook-id": message_id,
        "webhook-timestamp": str(timestamp),
        "webhook-signature": signature,
    }


class WebhookVerificationTest(unittest.TestCase):
    payload = b'{"type":"invoice.paid","id":"evt_1"}'

    def test_accepts_a_valid_signature(self) -> None:
        result = verify(SECRET, signed_headers(self.payload), self.payload, now=lambda: NOW)
        self.assertEqual(result.message_id, "msg_1")
        self.assertEqual(result.payload, self.payload)

    def test_header_names_are_case_insensitive(self) -> None:
        headers = {name.upper(): value for name, value in signed_headers(self.payload).items()}
        verify(SECRET, headers, self.payload, now=lambda: NOW)

    def test_rejects_a_tampered_body(self) -> None:
        with self.assertRaises(WebhookVerificationError):
            verify(SECRET, signed_headers(self.payload), self.payload + b" ", now=lambda: NOW)

    def test_rejects_a_wrong_secret(self) -> None:
        other = "whsec_" + base64.b64encode(b"another-secret-another-secret!!").decode()
        with self.assertRaises(WebhookVerificationError):
            verify(other, signed_headers(self.payload), self.payload, now=lambda: NOW)

    def test_rejects_old_and_future_timestamps(self) -> None:
        for offset in (-301, 301):
            clock = fixed_clock(float(NOW - offset))
            with self.subTest(offset=offset), self.assertRaises(WebhookVerificationError):
                verify(SECRET, signed_headers(self.payload), self.payload, now=clock)

    def test_rejects_missing_headers(self) -> None:
        with self.assertRaises(WebhookVerificationError):
            verify(SECRET, {}, self.payload, now=lambda: NOW)

    def test_accepts_any_signature_during_secret_rotation(self) -> None:
        headers = signed_headers(self.payload)
        headers["webhook-signature"] = "v1,AAAA " + headers["webhook-signature"]
        verify(SECRET, headers, self.payload, now=lambda: NOW)

    def test_duplicate_deliveries_are_detected(self) -> None:
        clock = [0.0]
        seen = SeenMessages(ttl_seconds=60, now=lambda: clock[0])
        self.assertTrue(seen.first_time("msg_1"))
        self.assertFalse(seen.first_time("msg_1"))
        clock[0] = 61.0
        self.assertTrue(seen.first_time("msg_1"))


class ScriptedHandler(BaseHTTPRequestHandler):
    """Replies with the next scripted (status, headers, body) and records each request."""

    script: ClassVar[list[tuple[int, dict[str, str], object]]] = []
    received: ClassVar[list[tuple[str, dict[str, str]]]] = []

    def _reply(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        self.rfile.read(length)
        ScriptedHandler.received.append((self.command, dict(self.headers)))
        status, headers, body = ScriptedHandler.script.pop(0)
        payload = json.dumps(body).encode()
        self.send_response(status)
        for key, value in headers.items():
            self.send_header(key, value)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    do_GET = _reply  # noqa: N815 - method names are fixed by BaseHTTPRequestHandler
    do_POST = _reply  # noqa: N815

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        return


@contextmanager
def scripted_server(script: Script) -> Generator[str]:
    ScriptedHandler.script = list(script)
    ScriptedHandler.received = []
    server = ThreadingHTTPServer(("127.0.0.1", 0), ScriptedHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


class JsonApiClientTest(unittest.TestCase):
    def make_client(self, base_url: str, sleeps: list[float]) -> JsonApiClient:
        return JsonApiClient(
            base_url,
            timeout_seconds=5,
            policy=RetryPolicy(max_attempts=3, base_delay_seconds=1, max_delay_seconds=10),
            sleep=sleeps.append,
            rand=lambda: 1.0,
        )

    def test_retries_transient_errors_then_succeeds(self) -> None:
        sleeps: list[float] = []
        script: Script = [(503, {}, {"error": "busy"}), (200, {}, {"ok": True})]
        with scripted_server(script) as url:
            response = self.make_client(url, sleeps).request("GET", "/items")
        self.assertEqual(response.status, 200)
        self.assertEqual(response.body, {"ok": True})
        self.assertEqual(sleeps, [1.0])

    def test_honours_retry_after(self) -> None:
        sleeps: list[float] = []
        script: Script = [(429, {"Retry-After": "7"}, {}), (200, {}, {})]
        with scripted_server(script) as url:
            self.make_client(url, sleeps).request("GET", "/items")
        self.assertEqual(sleeps, [7.0])

    def test_gives_up_after_max_attempts(self) -> None:
        sleeps: list[float] = []
        script: Script = [(502, {}, {}), (502, {}, {}), (502, {}, {})]
        with scripted_server(script) as url, self.assertRaises(ApiError) as raised:
            self.make_client(url, sleeps).request("GET", "/items")
        self.assertEqual(raised.exception.status, 502)
        self.assertEqual(sleeps, [1.0, 2.0])

    def test_does_not_retry_client_errors(self) -> None:
        script: Script = [(404, {}, {"error": "missing"})]
        with scripted_server(script) as url, self.assertRaises(ApiError) as raised:
            self.make_client(url, []).request("GET", "/missing")
        self.assertEqual(raised.exception.status, 404)
        self.assertEqual(raised.exception.body, {"error": "missing"})

    def test_does_not_retry_post_without_idempotency_key(self) -> None:
        script: Script = [(503, {}, {})]
        with scripted_server(script) as url, self.assertRaises(ApiError):
            self.make_client(url, []).request("POST", "/payments", json_body={"amount": 100})
        self.assertEqual(len(ScriptedHandler.received), 1)

    def test_retries_post_with_idempotency_key_and_sends_it(self) -> None:
        script: Script = [(503, {}, {}), (201, {}, {"id": "pay_1"})]
        with scripted_server(script) as url:
            client = self.make_client(url, [])
            response = client.request(
                "POST", "/payments", json_body={"amount": 100}, idempotency_key="order-42"
            )
        self.assertEqual(response.status, 201)
        keys = [headers.get("Idempotency-Key") for _, headers in ScriptedHandler.received]
        self.assertEqual(keys, ["order-42", "order-42"])

    def test_rejects_non_http_urls(self) -> None:
        with self.assertRaises(ValueError):
            JsonApiClient("file:///etc/passwd")


class BackoffTest(unittest.TestCase):
    def test_backoff_is_capped(self) -> None:
        policy = RetryPolicy(max_attempts=10, base_delay_seconds=1, max_delay_seconds=5)
        self.assertEqual(backoff_seconds(10, policy, rand=lambda: 1.0), 5)

    def test_retry_after_accepts_seconds_and_http_dates(self) -> None:
        self.assertEqual(retry_after_seconds("12"), 12.0)
        delay = retry_after_seconds("Wed, 21 Oct 2015 07:28:10 GMT", now=lambda: 1445412480.0)
        self.assertEqual(delay, 10.0)
        self.assertIsNone(retry_after_seconds("not a date"))

    def test_policy_rejects_zero_attempts(self) -> None:
        with self.assertRaises(ValueError):
            RetryPolicy(max_attempts=0)


if __name__ == "__main__":
    unittest.main()
