# @ikare backend starter

First backend step for the @ikare video-link app.

## Included
- `GET /api/health` health check
- `POST /api/check-link` validates a public HTTP/HTTPS link and identifies common platforms
- Security headers, rate limiting, origin configuration, and local/private IP checks

**Important:** This is not yet a downloader. It does not fetch/proxy arbitrary files, bypass login/DRM, or circumvent platform restrictions. Actual downloads should be added through provider-approved methods and only for content you own or have permission to save.

## Run locally
Requires Node.js 20+.

```bash
npm install
cp .env.example .env
npm start
```

Test:
```bash
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/check-link -H 'Content-Type: application/json' -d '{"url":"https://example.com/video.mp4"}'
```

Before public deployment, set `ALLOWED_ORIGINS` to your exact frontend origin and add monitoring/abuse controls. This ZIP does not publish the existing site preview.
