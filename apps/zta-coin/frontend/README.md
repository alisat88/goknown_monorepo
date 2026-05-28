# ZTA Coin React Frontend

Standalone Vite + React dashboard for zta-coin.org.

## Local Development

```bash
cd apps/zta-coin/frontend
npm install
cp .env.example .env
npm run dev
```

## Configuration

Set `VITE_ZTA_API_URL` to the ZTA backend base URL. The React app only calls the public demo API endpoints and must not include `ZTA_ADMIN_USERNAME` or `ZTA_ADMIN_PASSWORD`.

Production admin access should be protected by host-level auth, a serverless auth proxy, or backend auth in a later pass.
