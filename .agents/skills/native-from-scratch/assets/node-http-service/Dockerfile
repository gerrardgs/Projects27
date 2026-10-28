# syntax=docker/dockerfile:1
# Minimal runtime: distroless Node.js 24 on Debian 13 (no shell, no package manager, non-root user 65532).
# Base image pinned by digest (resolved 2026-10-22, Debian 13.7). A Trivy 0.76.0 scan (linux/amd64) on
# 2026-10-22 found 0 critical and 0 high vulnerabilities in it; on 2026-10-16 node:24-slim had 4 critical
# and 64 high. Dependabot's "docker" ecosystem keeps the digest current.
#
# This service has no runtime npm dependencies. If you add some, install them in a separate build stage
# (FROM node:24-slim AS deps, then RUN npm ci --omit=dev) and COPY only node_modules into this image.
FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:78f07ef1b5ea71ad7c055df15d0dd8997f2d288f9158623c4d4ae3d765b7d50d

ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY server.ts ./

# The image already runs as the unprivileged "nonroot" user; stated explicitly for reviewers and scanners.
USER 65532:65532
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

# The image's entrypoint is /nodejs/bin/node; exec form so SIGTERM reaches Node.js for graceful shutdown.
CMD ["server.ts"]
