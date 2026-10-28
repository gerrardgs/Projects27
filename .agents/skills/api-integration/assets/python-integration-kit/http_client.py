"""A small, resilient JSON client for third-party HTTP APIs, using only the standard library.

What it does on purpose:
- every request has a timeout;
- retries only transient failures (connection errors, 408, 429, 500, 502, 503, 504);
- retries only idempotent methods, or non-idempotent ones that carry an Idempotency-Key;
- exponential backoff with full jitter, capped, and Retry-After honoured (seconds or HTTP date);
- a bounded number of attempts, then a typed error with the last status.
"""

from __future__ import annotations

import email.utils
import json
import random
import time
import urllib.error
import urllib.request
from collections.abc import Callable, Mapping
from dataclasses import dataclass

RETRYABLE_STATUSES = frozenset({408, 429, 500, 502, 503, 504})
IDEMPOTENT_METHODS = frozenset({"GET", "HEAD", "OPTIONS", "PUT", "DELETE"})


@dataclass(frozen=True, slots=True)
class RetryPolicy:
    max_attempts: int = 4
    base_delay_seconds: float = 0.5
    max_delay_seconds: float = 30.0

    def __post_init__(self) -> None:
        if self.max_attempts < 1:
            raise ValueError("max_attempts must be at least 1")
        if self.base_delay_seconds < 0 or self.max_delay_seconds < 0:
            raise ValueError("delays must not be negative")


@dataclass(frozen=True, slots=True)
class ApiResponse:
    status: int
    headers: Mapping[str, str]
    body: object


class ApiError(Exception):
    """A request that failed permanently, or still failed after all retries."""

    def __init__(self, message: str, status: int | None = None, body: object = None) -> None:
        super().__init__(f"{message} (status={status})")
        self.status = status
        self.body = body


def retry_after_seconds(value: str | None, now: Callable[[], float] = time.time) -> float | None:
    """Parse Retry-After as delay seconds or as an HTTP date (RFC 9110, section 10.2.3)."""
    if not value:
        return None
    if value.strip().isdigit():
        return float(value.strip())
    try:
        moment = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, float(moment.timestamp()) - now())


def backoff_seconds(attempt: int, policy: RetryPolicy, rand: Callable[[], float]) -> float:
    """Full jitter: a random delay between 0 and the capped exponential bound."""
    bound = min(policy.max_delay_seconds, policy.base_delay_seconds * (2.0 ** (attempt - 1)))
    return rand() * bound


class JsonApiClient:
    def __init__(
        self,
        base_url: str,
        *,
        default_headers: Mapping[str, str] | None = None,
        timeout_seconds: float = 10.0,
        policy: RetryPolicy | None = None,
        sleep: Callable[[float], None] = time.sleep,
        rand: Callable[[], float] = random.random,
    ) -> None:
        if not base_url.startswith(("https://", "http://")):
            raise ValueError("base_url must start with https:// (or http:// for local testing)")
        self._base_url = base_url.rstrip("/")
        self._headers = dict(default_headers or {})
        self._timeout = timeout_seconds
        self._policy = policy or RetryPolicy()
        self._sleep = sleep
        self._rand = rand

    def request(
        self,
        method: str,
        path: str,
        *,
        json_body: object = None,
        idempotency_key: str | None = None,
    ) -> ApiResponse:
        method = method.upper()
        may_retry = method in IDEMPOTENT_METHODS or idempotency_key is not None
        headers = {"Accept": "application/json", **self._headers}
        data = None
        if json_body is not None:
            data = json.dumps(json_body).encode()
            headers["Content-Type"] = "application/json"
        if idempotency_key is not None:
            headers["Idempotency-Key"] = idempotency_key

        last_error = ApiError(f"{method} {path} was not attempted")
        for attempt in range(1, self._policy.max_attempts + 1):
            # The URL scheme is restricted to http(s) in __init__, so Ruff S310 and Bandit B310
            # (file: and custom schemes) do not apply.
            url = f"{self._base_url}/{path.lstrip('/')}"
            request = urllib.request.Request(url, data=data, headers=headers, method=method)  # noqa: S310  # nosec B310
            try:
                with urllib.request.urlopen(request, timeout=self._timeout) as response:  # noqa: S310  # nosec B310
                    body = _decode(response.read())
                    return ApiResponse(response.status, dict(response.headers), body)
            except urllib.error.HTTPError as error:
                body = _decode(error.read())
                last_error = ApiError(f"{method} {path} failed", error.code, body)
                if error.code not in RETRYABLE_STATUSES or not may_retry:
                    raise last_error from None
                delay = retry_after_seconds(error.headers.get("Retry-After"))
            except (urllib.error.URLError, TimeoutError) as error:
                last_error = ApiError(f"{method} {path} failed: {error}")
                if not may_retry:
                    raise last_error from None
                delay = None
            if attempt < self._policy.max_attempts:
                wait = (
                    delay
                    if delay is not None
                    else backoff_seconds(attempt, self._policy, self._rand)
                )
                self._sleep(min(wait, self._policy.max_delay_seconds))
        raise last_error


def _decode(raw: bytes) -> object:
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return raw.decode(errors="replace")
