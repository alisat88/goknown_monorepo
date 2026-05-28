# ZTA Coin Deployment Status

The ZTA Coin React frontend and backend are deployed in production with clean custom domains.

## Production URLs

- Frontend: https://zta-coin.org
- Backend API: https://api.zta-coin.org

## Smoke Test Results

- `curl -I https://zta-coin.org` returned HTTP 200.
- `curl -I https://www.zta-coin.org` returned HTTP 301 redirecting to `https://zta-coin.org/`.
- `curl -i https://api.zta-coin.org/health` returned HTTP 200 and `"Server Connected on node 1"`.
- `curl -i https://api.zta-coin.org/velocity/Mike` returned HTTP 200.

## Render Deployment Notes

- Frontend Render Static Site root directory: `apps/zta-coin/frontend`
- Backend Render Web Service root directory: `apps/zta-coin/backend`
- Frontend environment variable: `VITE_ZTA_API_URL=https://api.zta-coin.org`

## Domain Usage Note

The public-facing app should use `zta-coin.org`, and the API should use `api.zta-coin.org`. Production traffic should not use `onrender.com`, `streamlit.app`, or `localhost`.
