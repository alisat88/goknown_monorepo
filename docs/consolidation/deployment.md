# Deployment Notes

## Public Domains

Use clean public domains in user-facing links:

- KnownCompute: `https://knowncompute.ai`
- ZTA Coin: `https://zta-coin.org`

The GoKnown dashboard should point users to these domains instead of Streamlit Cloud implementation URLs.

## Backend URLs

Render URLs and similar platform URLs should be treated as backend/internal configuration only. They may still appear in app configuration or documentation when describing backend services, but should not be presented as the public app URL.

ZTA Coin currently has a Streamlit default backend URL that points to a Render service. Keep this configurable through `BACKEND_URL` and avoid baking backend platform URLs into public navigation.

KnownCompute should use `API_URL` for the Streamlit-to-FastAPI connection. In deployment, configure `API_URL` to the deployed backend endpoint for that environment.

## Secrets

- Configure secrets through deployment platform secret stores.
- Do not deploy local `.env` files.
- Do not commit `.streamlit/secrets.toml`.
- Replace hardcoded admin credential constants in ZTA Coin with environment-driven values before production use.

## Backend Consolidation

Backend logic has not been merged in this snapshot. KnownCompute FastAPI and ZTA Coin Node/Express should be deployed and validated independently before any later backend consolidation work.
