# Consolidation App Inventory

## GoKnown Dashboard

- Location: `frontend/` and `backend/`
- UI: React dashboard
- API: Node/Express TypeScript backend
- Store: PostgreSQL, Redis, and configured file storage providers
- Notes: This remains the parent application and launcher/dashboard surface.

## KnownCompute

- Location: `apps/knowncompute/`
- Source repo: `/Users/AlisaT/Desktop/dapp_state_service`
- Published URL: `https://knowncompute.ai`
- UI: Streamlit dashboard at `frontend/streamlit_app.py`
- API: FastAPI backend at `backend/main.py`
- Compute: workflow generation, workflow execution, anomaly scoring, and analytics
- Store: local SQLite by default through `backend/database.py`
- Notes: Snapshot copy only. External repo history was not preserved. Cache files and local virtualenv files were excluded.

## ZTA Coin

- Location: `apps/zta-coin/`
- Source repo: `/Users/AlisaT/Desktop/dappgenius-demo`
- Published URL: `https://zta-coin.org`
- UI: Streamlit payment dashboard at `app.py` and `streamlit/app.py`
- API: Node/Express TypeScript backend at `backend/`
- Compute: mint, transfer, velocity, and health API calls
- Store: backend uses the copied Node service's existing PostgreSQL/Redis configuration
- Notes: The copied folder originally named `backend 2` was renamed to `backend` after confirming no internal references to `backend 2`.

## Consolidation Boundary

- Backend logic was not merged.
- Public app links should use `https://knowncompute.ai` and `https://zta-coin.org`.
- Render or other platform URLs should be treated as backend/internal configuration, not public app URLs.
- Local secrets must stay out of git. Use `.env.example` files for variable names only.
