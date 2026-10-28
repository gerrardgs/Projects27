# syntax=docker/dockerfile:1
# Minimal runtime: distroless Python 3.13 on Debian 13 (no shell, no pip, non-root user 65532).
# The service uses only the standard library and supports Python 3.11+, so no build stage is needed.
# Base image pinned by digest (resolved 2026-10-22, Debian 13.7). A Trivy 0.76.0 scan (linux/amd64) on
# 2026-10-22 found 0 critical and 26 high vulnerabilities, none with a fix released yet; the previous
# digest had 31 high. On 2026-10-16 python:3.14-slim had 48 high (4 fixable). Dependabot's "docker"
# ecosystem keeps the digest current; rescan regularly.
# http.server suits internal services; put it behind a reverse proxy for internet-facing traffic.
FROM gcr.io/distroless/python3-debian13:nonroot@sha256:727eccc5d83f11273c954652667b5b5a1c66120bd4cfb884e879ab77dcdf966a

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8000
WORKDIR /app
COPY app.py ./

USER 65532:65532
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/usr/bin/python3.13", "-c", "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2).status == 200 else 1)"]

# The image's entrypoint is /usr/bin/python3.13; exec form so SIGTERM reaches Python for graceful shutdown.
CMD ["app.py"]
