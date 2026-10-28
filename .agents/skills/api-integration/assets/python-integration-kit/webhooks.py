"""Verify incoming webhooks signed with the Standard Webhooks scheme (standard library only).

Scheme (https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md):
  headers   webhook-id, webhook-timestamp (Unix seconds), webhook-signature ("v1,<base64>" entries,
            space-separated, so several can be valid during secret rotation)
  content   "<webhook-id>.<webhook-timestamp>.<raw body>"
  algorithm HMAC-SHA256 with the secret decoded from "whsec_<base64>"

Many providers use their own header names and formats: adapt the signed content and the header
parsing, but keep the constant-time comparison, the timestamp tolerance and the deduplication.
"""

from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import threading
import time
from collections.abc import Callable, Mapping
from dataclasses import dataclass

# A format prefix, not a secret (Ruff S105 / Bandit B105 false positive).
SECRET_PREFIX = "whsec_"  # noqa: S105  # nosec B105
SIGNATURE_VERSION = "v1"
# The specification asks for "some allowable tolerance" without a number; 5 minutes is common.
DEFAULT_TOLERANCE_SECONDS = 5 * 60


class WebhookVerificationError(Exception):
    """The request must be rejected (respond 400 or 401, and do not process it)."""


@dataclass(frozen=True, slots=True)
class VerifiedWebhook:
    message_id: str
    timestamp: int
    payload: bytes


def decode_secret(secret: str) -> bytes:
    encoded = secret.removeprefix(SECRET_PREFIX)
    try:
        key = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ValueError("webhook secret is not valid base64") from error
    if not key:
        raise ValueError("webhook secret is empty")
    return key


def sign(key: bytes, message_id: str, timestamp: int, payload: bytes) -> str:
    """Return one "v1,<base64>" signature. Used by senders and by tests."""
    content = f"{message_id}.{timestamp}.".encode() + payload
    digest = hmac.new(key, content, hashlib.sha256).digest()
    return f"{SIGNATURE_VERSION},{base64.b64encode(digest).decode()}"


def verify(
    secret: str,
    headers: Mapping[str, str],
    payload: bytes,
    *,
    tolerance_seconds: int = DEFAULT_TOLERANCE_SECONDS,
    now: Callable[[], float] = time.time,
) -> VerifiedWebhook:
    """Verify signature and freshness of a webhook.

    `payload` must be the raw request body, exactly as received (not re-serialized JSON).
    """
    lowered = {name.lower(): value for name, value in headers.items()}
    message_id = lowered.get("webhook-id", "")
    raw_timestamp = lowered.get("webhook-timestamp", "")
    signatures = lowered.get("webhook-signature", "")
    if not message_id or not raw_timestamp or not signatures:
        raise WebhookVerificationError("missing webhook-id, webhook-timestamp or webhook-signature")

    try:
        timestamp = int(raw_timestamp)
    except ValueError:
        raise WebhookVerificationError("webhook-timestamp is not an integer") from None
    if abs(now() - timestamp) > tolerance_seconds:
        raise WebhookVerificationError("webhook timestamp outside tolerance (possible replay)")

    expected = sign(decode_secret(secret), message_id, timestamp, payload).encode()
    for candidate in signatures.split(" "):
        if hmac.compare_digest(candidate.encode(), expected):
            return VerifiedWebhook(message_id=message_id, timestamp=timestamp, payload=payload)
    raise WebhookVerificationError("no matching signature")


class SeenMessages:
    """Remembers processed webhook IDs so redeliveries are acknowledged but not processed twice.

    In-memory and per process: use a shared store (database unique key, Redis SET NX with expiry)
    when several instances receive webhooks.
    """

    def __init__(self, ttl_seconds: float, now: Callable[[], float] = time.monotonic) -> None:
        self._ttl = ttl_seconds
        self._now = now
        self._expires_at: dict[str, float] = {}
        self._lock = threading.Lock()

    def first_time(self, message_id: str) -> bool:
        current = self._now()
        with self._lock:
            self._expires_at = {key: exp for key, exp in self._expires_at.items() if exp > current}
            if message_id in self._expires_at:
                return False
            self._expires_at[message_id] = current + self._ttl
            return True
