"""Run with: python3 -m unittest -v"""

from __future__ import annotations

import http.client
import json
import threading
import unittest
from typing import ClassVar

from app import AppServer, NewUser, UserStore, create_server, parse_new_user


class ParseNewUserTest(unittest.TestCase):
    def test_accepts_and_normalises_valid_user(self) -> None:
        self.assertEqual(
            parse_new_user({"name": "  Ada Lovelace ", "email": "Ada@Example.com"}),
            NewUser(name="Ada Lovelace", email="ada@example.com"),
        )

    def test_rejects_non_object_bodies(self) -> None:
        for payload in (None, 42, "text", ["a"]):
            with self.subTest(payload=payload):
                self.assertIsInstance(parse_new_user(payload), list)

    def test_reports_every_invalid_field(self) -> None:
        self.assertEqual(
            parse_new_user({"name": "", "email": "not-an-email"}),
            ["name is required", "email must be a valid address"],
        )


class HttpServiceTest(unittest.TestCase):
    server: ClassVar[AppServer]
    thread: ClassVar[threading.Thread]
    port: ClassVar[int]

    @classmethod
    def setUpClass(cls) -> None:
        cls.server = create_server(UserStore())
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def request(
        self,
        method: str,
        path: str,
        body: bytes | None = None,
        content_type: str = "application/json",
    ) -> tuple[int, dict[str, str], object]:
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        try:
            headers = {"Content-Type": content_type} if body is not None else {}
            connection.request(method, path, body=body, headers=headers)
            response = connection.getresponse()
            raw = response.read()
            parsed: object = json.loads(raw) if raw else None
            return response.status, dict(response.getheaders()), parsed
        finally:
            connection.close()

    def post_json(self, path: str, payload: object) -> tuple[int, dict[str, str], object]:
        return self.request("POST", path, json.dumps(payload).encode())

    def test_creates_and_reads_back_user(self) -> None:
        status, _, created = self.post_json("/users", {"name": "Ada", "email": "ada@example.com"})
        self.assertEqual(status, 201)
        if not isinstance(created, dict):
            self.fail(f"expected a JSON object, got {created!r}")
        status, _, fetched = self.request("GET", f"/users/{created['id']}")
        self.assertEqual(status, 200)
        self.assertEqual(fetched, created)

    def test_unknown_user_is_404(self) -> None:
        self.assertEqual(self.request("GET", "/users/missing")[0], 404)

    def test_malformed_json_is_400(self) -> None:
        self.assertEqual(self.request("POST", "/users", b"{not json")[0], 400)

    def test_invalid_fields_are_400_with_details(self) -> None:
        status, _, body = self.post_json("/users", {"name": "Ada"})
        self.assertEqual(status, 400)
        self.assertEqual(
            body, {"error": "Validation failed", "details": ["email must be a valid address"]}
        )

    def test_oversized_body_is_413(self) -> None:
        status, _, _ = self.post_json("/users", {"name": "x" * 20_000, "email": "a@example.com"})
        self.assertEqual(status, 413)

    def test_wrong_content_type_is_415(self) -> None:
        status, _, _ = self.request("POST", "/users", b"name=Ada", content_type="text/plain")
        self.assertEqual(status, 415)

    def test_wrong_method_is_405_with_allow_header(self) -> None:
        status, headers, _ = self.request("GET", "/users")
        self.assertEqual(status, 405)
        self.assertEqual(headers.get("Allow"), "POST")

    def test_health(self) -> None:
        self.assertEqual(self.request("GET", "/health")[2], {"status": "ok"})


if __name__ == "__main__":
    unittest.main()
