# Local Development

## GoKnown Dashboard

Docker/local environment:

```bash
./start.sh
```

Or:

```bash
cd local-env
docker-compose up --build
```

Expected local services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3333`

Direct app commands:

```bash
cd backend
yarn dev:server
```

```bash
cd frontend
yarn start
```

## KnownCompute

KnownCompute has a FastAPI backend and a Streamlit frontend.
The backend uses SQLite by default through `backend/database.py`, which points to `sqlite:///./dappgenius.db`.
That `dappgenius.db` file is generated local state and is not committed.
If seed or demo data is ever required, add it through a documented seed script instead of committing a local database file.

Install dependencies in an app-local virtual environment:

```bash
cd apps/knowncompute
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the API:

```bash
cd apps/knowncompute/backend
uvicorn main:app --reload --port 8003
```

Run the Streamlit UI:

```bash
cd apps/knowncompute
API_URL=http://127.0.0.1:8003 streamlit run frontend/streamlit_app.py
```

The main Streamlit dashboard expects the FastAPI service to be available through `API_URL`.

## ZTA Coin

ZTA Coin has a Streamlit UI and a separate Node/Express backend.

Run the Streamlit UI:

```bash
cd apps/zta-coin
BACKEND_URL=http://localhost:3333 streamlit run app.py
```

Alternative Streamlit entry:

```bash
cd apps/zta-coin
BACKEND_URL=http://localhost:3333 streamlit run streamlit/app.py
```

Run the copied backend:

```bash
cd apps/zta-coin/backend
yarn install
yarn dev:server
```

The backend may also require PostgreSQL, Redis, and environment variables listed in `apps/zta-coin/.env.example`. The copied backend also includes Docker and Compose files that can be reviewed before use.

## Secret Handling

- Do not commit local `.env` files.
- Do not commit `.streamlit/secrets.toml`.
- The ZTA Coin Streamlit app currently contains hardcoded admin credential constants; migrate those to environment variables before production deployment.
