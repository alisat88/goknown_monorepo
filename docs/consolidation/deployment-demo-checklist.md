# Deployment And Local Demo Checklist

Use this checklist for a local boss/team demo and for tracking what remains before public deployment. This is a documentation-only deployment guide; do not commit real secrets or private credentials.

## A. Current Repo Structure

| Area | Location | Purpose |
| --- | --- | --- |
| Main GoKnown / DAppGenius frontend | `frontend/` | React dashboard and sidebar launcher. |
| Main GoKnown / DAppGenius backend | `backend/` | Node/Express TypeScript API for the dashboard. |
| KnownCompute | `apps/knowncompute/` | Streamlit UI plus FastAPI workflow/anomaly backend. |
| ZTA Coin | `apps/zta-coin/` | Streamlit token/payment demo plus copied Node backend. |
| Consolidation docs | `docs/consolidation/` | Inventory, deployment, domain, local development, and checklist docs. |
| Local Docker environment | `local-env/` | Docker Compose setup for PostgreSQL, Redis, backend, and frontend. |

## B. Local Demo Startup Checklist

1. Open Docker Desktop and confirm it is running.
2. Start the local GoKnown stack:

   ```bash
   cd /Users/AlisaT/Desktop/goknown_monorepo/local-env
   docker-compose up -d postgres redis backend frontend
   ```

3. Seed the repeatable local test user:

   ```bash
   docker-compose exec backend sh -c "ALLOW_LOCAL_USER_SEED=true yarn seed:local-user"
   ```

4. Open the frontend:

   ```bash
   open http://localhost:3000
   ```

5. Log in with the local test user:

   ```text
   email: local.test@goknown.dev
   password: TestPassword123!
   ```

6. Open the dashboard:

   ```text
   http://localhost:3000/dashboard
   ```

## C. Sidebar App Validation Checklist

After login, validate that each sidebar item opens the expected internal route or public target URL.

| Sidebar item | Expected route or URL | Check |
| --- | --- | --- |
| Digital Assets | `/digitalassets` | Opens internal dashboard route. |
| Wallet | `/transactions` | Opens internal dashboard route. |
| Groups | `/groups` | Opens internal dashboard route. |
| Data Forms | `/dataforms` | Opens internal dashboard route. |
| Organizations | `/organizations` | Opens internal dashboard route. |
| Messenger | `/messenger` | Opens internal dashboard route. |
| Audit Logs | `/auditlogs` | Opens internal dashboard route. |
| User Manager | `/users` | Opens internal dashboard route. |
| Laboratory | `/labs` | Opens internal dashboard route. |
| KnownCompute | `https://knowncompute.ai` | Opens clean public target domain. |
| ZTA Coin | `https://zta-coin.org` | Opens clean public target domain. |

## D. External App URL Configuration

Production source defaults should remain:

```env
REACT_APP_KNOWNCOMPUTE_URL=https://knowncompute.ai
REACT_APP_ZTA_COIN_URL=https://zta-coin.org
```

For local or temporary demos while DNS is pending, override these values through environment configuration only:

```env
REACT_APP_KNOWNCOMPUTE_URL=https://temporary-knowncompute-streamlit-url
REACT_APP_ZTA_COIN_URL=https://temporary-zta-coin-streamlit-url
```

Do not change frontend source code back to Streamlit implementation URLs. Keep Streamlit URLs as temporary build/deployment configuration.

## E. ZTA Coin Deployment And Secrets Checklist

Required ZTA Coin deployment values:

| Variable | Purpose | Local location | Streamlit deployment location |
| --- | --- | --- | --- |
| `ZTA_ADMIN_USERNAME` | Admin login username. | Shell environment or local uncommitted `apps/zta-coin/.env`. | Streamlit secrets or deployment environment variables. |
| `ZTA_ADMIN_PASSWORD` | Admin login password. | Shell environment or local uncommitted `apps/zta-coin/.env`. | Streamlit secrets or deployment environment variables. |
| `BACKEND_URL` | ZTA backend API URL for mint, transfer, velocity, and health calls. | Shell environment or local uncommitted `apps/zta-coin/.env`. | Streamlit secrets or deployment environment variables. |

Local example with placeholder values:

```bash
cd /Users/AlisaT/Desktop/goknown_monorepo/apps/zta-coin
export ZTA_ADMIN_USERNAME="local-admin"
export ZTA_ADMIN_PASSWORD="local-password"
export BACKEND_URL="http://localhost:3333"
streamlit run app.py
```

Streamlit secrets can use the same key names:

```toml
ZTA_ADMIN_USERNAME = "set-in-streamlit-secrets"
ZTA_ADMIN_PASSWORD = "set-in-streamlit-secrets"
BACKEND_URL = "set-to-deployed-backend-url"
```

No real credentials, private boss credentials, local `.env` files, or `.streamlit/secrets.toml` files should be committed.

## F. KnownCompute Deployment Checklist

1. Confirm the current Streamlit/deployment URL before the demo.
2. Confirm the FastAPI backend URL, if the Streamlit UI is not using a same-platform backend.
3. Confirm required environment variables from `apps/knowncompute/.env.example`:

   ```env
   API_URL=
   DATABASE_URL=
   STREAMLIT_SERVER_PORT=
   FASTAPI_PORT=
   ```

4. Set `API_URL` to the deployed FastAPI endpoint for the target environment.
5. Keep the public target domain as:

   ```text
   https://knowncompute.ai
   ```

## G. Domain/DNS Checklist For Boss Meeting

Confirm these ownership and routing items before final deployment:

| Item | Status / note |
| --- | --- |
| GoDaddy access | Confirm who can log in and approve owner verification. |
| DNS provider | Confirm whether each domain is managed in GoDaddy or Cloudflare. |
| `knowncompute.ai` | Confirm purchased and available for DNS or forwarding setup. |
| `zta-coin.org` | Confirm purchased and available for DNS or forwarding setup. |
| Main app domain | Confirm whether GoKnown controls `dappgenius.app` or `goknown.app`. |
| DAppGenius public URL | Decide the clean public domain for the main GoKnown / DAppGenius app. |
| KnownCompute routing | Configure DNS or forwarding to the deployed KnownCompute app. |
| ZTA Coin routing | Configure DNS or forwarding to the deployed ZTA Coin app. |
| `zta-coin.org` current behavior | Currently appears parked until DNS/forwarding is configured. |

## H. Completed Work Summary

- Consolidated KnownCompute into `apps/knowncompute/`.
- Consolidated ZTA Coin into `apps/zta-coin/`.
- Updated clean external links for KnownCompute and ZTA Coin.
- Wired sidebar routes for internal dashboard apps and external app launches.
- Added repeatable local test login seed.
- Made external app URLs configurable with `REACT_APP_KNOWNCOMPUTE_URL` and `REACT_APP_ZTA_COIN_URL`.
- Moved ZTA admin credentials to environment variables / Streamlit secrets with `ZTA_ADMIN_USERNAME` and `ZTA_ADMIN_PASSWORD`.

## I. Remaining Follow-Ups

- Configure GoDaddy/DNS after domain-owner verification is complete.
- Decide the main DAppGenius public domain, likely `dappgenius.app` or `goknown.app` if GoKnown controls one of them.
- Verify KnownCompute and ZTA Coin deployments after DNS or forwarding is configured.
- Optionally fix the Docker healthcheck if the backend process is running but Docker still reports the container as unhealthy.
- Create final production deployment documentation after domain decisions are confirmed.
