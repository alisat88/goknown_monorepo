# KnownCompute React Frontend

Standalone Vite + React frontend for KnownCompute.

## Local Development

```bash
npm install
npm run dev
```

Set the backend API URL with:

```bash
VITE_KNOWNCOMPUTE_API_URL=https://api.knowncompute.ai
```

For local FastAPI development, use:

```bash
VITE_KNOWNCOMPUTE_API_URL=http://127.0.0.1:8003
```

## Render Static Site

- Root Directory: `apps/knowncompute/frontend-react`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variable: `VITE_KNOWNCOMPUTE_API_URL=https://api.knowncompute.ai`
