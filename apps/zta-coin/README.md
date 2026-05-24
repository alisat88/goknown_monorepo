# ZTA Coin

ZTA Coin is a Streamlit demo for token minting, payments, velocity tracking, and user analytics.

## Local Configuration

The Streamlit admin login is configured with environment variables. Do not commit real credential values.

Required admin variables:

```env
ZTA_ADMIN_USERNAME=
ZTA_ADMIN_PASSWORD=
```

No admin PIN or admin token is currently used by the Streamlit app.

To run locally from shell environment variables:

```bash
cd apps/zta-coin
export ZTA_ADMIN_USERNAME="your-local-admin-user"
export ZTA_ADMIN_PASSWORD="your-local-admin-password"
streamlit run app.py
```

If you keep local values in `.env`, load them into your shell before starting Streamlit:

```bash
cd apps/zta-coin
set -a
source .env
set +a
streamlit run app.py
```

Use non-production local credentials for development. The app will not enable admin login unless both `ZTA_ADMIN_USERNAME` and `ZTA_ADMIN_PASSWORD` are set.

## Streamlit Deployment

Production deployments can configure the same names as Streamlit secrets or environment variables.

Example `.streamlit/secrets.toml` keys:

```toml
ZTA_ADMIN_USERNAME = "set-in-streamlit-secrets"
ZTA_ADMIN_PASSWORD = "set-in-streamlit-secrets"
```

Do not commit `.streamlit/secrets.toml`; it is ignored by this app.

## Backend URL

Set `BACKEND_URL` to point the Streamlit app at the ZTA backend for the target environment.
