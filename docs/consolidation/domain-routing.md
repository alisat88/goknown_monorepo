# Domain Routing

## Production Targets

GoKnown user-facing links should use the clean production domains:

- KnownCompute: `https://knowncompute.ai`
- ZTA Coin: `https://zta-coin.org`

These are the production target URLs for the dashboard and related frontend
navigation.

## Current External Blocker

GoDaddy/DNS owner verification is currently the blocker for completing domain
routing. Until the domain owner can complete verification and configure DNS or
forwarding, a clean domain may still show a parked page even though the GoKnown
frontend points to the correct production target.

## Local And Demo Overrides

Local or demo builds can temporarily point the dashboard to implementation URLs,
including Streamlit URLs, with React build-time environment variables:

```env
REACT_APP_KNOWNCOMPUTE_URL=https://example-knowncompute-streamlit-url
REACT_APP_ZTA_COIN_URL=https://example-zta-coin-streamlit-url
```

These overrides are temporary environment configuration only. Do not change the
frontend source defaults back to Streamlit URLs; source code should preserve the
clean production domains as the fallback values.
