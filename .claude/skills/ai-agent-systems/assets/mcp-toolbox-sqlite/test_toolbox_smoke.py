"""End-to-end check of tools.yaml through the real MCP stdio transport.

Run with: TOOLBOX_BIN=/path/to/toolbox python -m unittest -v
The toolbox binary must be the pinned release (see README.md); this test downloads nothing.
"""

from __future__ import annotations

import json
import os
import sqlite3
import subprocess
import tempfile
import unittest
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
TIMEOUT_SECONDS = 30


class McpStdioClient:
    """A minimal MCP client: newline-delimited JSON-RPC 2.0 over the server's stdin and stdout."""

    def __init__(self, command: list[str], env: dict[str, str]) -> None:
        self._process = subprocess.Popen(  # noqa: S603 - fixed argument list, no shell
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            env=env,
            text=True,
        )
        self._next_id = 0

    def request(self, method: str, params: dict[str, Any]) -> dict[str, Any]:
        self._next_id += 1
        self._send({"jsonrpc": "2.0", "id": self._next_id, "method": method, "params": params})
        while True:
            message = self._receive()
            if message.get("id") == self._next_id:
                return message

    def notify(self, method: str) -> None:
        self._send({"jsonrpc": "2.0", "method": method})

    def close(self) -> None:
        if self._process.stdin is not None:
            self._process.stdin.close()
        try:
            self._process.wait(timeout=TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired:
            self._process.kill()
            self._process.wait()
        if self._process.stdout is not None:
            self._process.stdout.close()

    def _send(self, message: dict[str, Any]) -> None:
        if self._process.stdin is None:
            raise RuntimeError("server stdin is closed")
        self._process.stdin.write(json.dumps(message) + "\n")
        self._process.stdin.flush()

    def _receive(self) -> dict[str, Any]:
        if self._process.stdout is None:
            raise RuntimeError("server stdout is closed")
        line = self._process.stdout.readline()
        if not line:
            raise RuntimeError("server exited before answering")
        message: dict[str, Any] = json.loads(line)
        return message


def toolbox_binary() -> str:
    binary = os.environ.get("TOOLBOX_BIN")
    if not binary or not Path(binary).is_file():
        raise RuntimeError("set TOOLBOX_BIN to the pinned toolbox binary (see README.md)")
    return binary


def rows(result: dict[str, Any]) -> list[dict[str, Any]]:
    """Decodes a sqlite-sql tool result: one JSON object per text content item, one item per row."""
    content = result["result"]["content"]
    return [json.loads(item["text"]) for item in content if item["type"] == "text"]


class ToolboxSmokeTest(unittest.TestCase):
    client: McpStdioClient
    _workdir: tempfile.TemporaryDirectory[str]

    @classmethod
    def setUpClass(cls) -> None:
        cls._workdir = tempfile.TemporaryDirectory()
        database = Path(cls._workdir.name) / "catalog.db"
        with sqlite3.connect(database) as connection:
            connection.executescript((HERE / "seed.sql").read_text(encoding="utf-8"))
        env = {"PATH": os.environ.get("PATH", ""), "CATALOG_DB": str(database)}
        command = [
            toolbox_binary(),
            "--config",
            str(HERE / "tools.yaml"),
            "--stdio",
            "--disable-version-check",
        ]
        cls.client = McpStdioClient(command, env)
        initialized = cls.client.request(
            "initialize",
            {
                "protocolVersion": "2025-06-18",
                "capabilities": {},
                "clientInfo": {"name": "smoke-test", "version": "1.0.0"},
            },
        )
        if "result" not in initialized:
            raise RuntimeError(f"initialize failed: {initialized}")
        cls.client.notify("notifications/initialized")

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client.close()
        cls._workdir.cleanup()

    def call(self, tool: str, arguments: dict[str, str]) -> dict[str, Any]:
        return self.client.request("tools/call", {"name": tool, "arguments": arguments})

    def test_exposes_only_the_two_read_only_tools(self) -> None:
        tools = self.client.request("tools/list", {})["result"]["tools"]
        self.assertEqual(
            sorted(tool["name"] for tool in tools),
            ["get-product-by-sku", "list-products-by-category"],
        )
        for tool in tools:
            self.assertTrue(tool["annotations"]["readOnlyHint"], tool["name"])
            self.assertFalse(tool["annotations"]["destructiveHint"], tool["name"])

    def test_lists_a_category_cheapest_first(self) -> None:
        result = rows(self.call("list-products-by-category", {"category": "books"}))
        self.assertEqual([row["sku"] for row in result], ["BK-002", "BK-001"])

    def test_gets_one_product(self) -> None:
        result = rows(self.call("get-product-by-sku", {"sku": "GD-002"}))
        self.assertEqual(
            result,
            [
                {
                    "sku": "GD-002",
                    "name": "Watering Can",
                    "category": "garden",
                    "price_cents": 1999,
                    "stock": 0,
                }
            ],
        )

    def test_injection_attempts_are_treated_as_data(self) -> None:
        for payload in ("BK-001' OR '1'='1", "x'; DROP TABLE products; --"):
            self.assertEqual(rows(self.call("get-product-by-sku", {"sku": payload})), [], payload)
        self.assertEqual(
            len(rows(self.call("list-products-by-category", {"category": "books"}))), 2
        )

    def test_unknown_tools_are_rejected(self) -> None:
        response = self.call("execute_sql", {"sql": "DELETE FROM products"})
        failed = "error" in response or response.get("result", {}).get("isError") is True
        self.assertTrue(failed, response)


if __name__ == "__main__":
    unittest.main()
