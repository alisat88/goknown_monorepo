# ZTA Coin React Frontend

Standalone Vite/React dashboard for zta-coin.org, maintained in this monorepo.
`src/main.tsx` retains the demo dashboard. `PersonalBalancePanel.tsx` displays only
`GET /me/balance` data; demo account selections never affect personal ownership.

## Local checks

Use Node 22, `npm ci`, `npm run build`, and `npm test`.
The component tests mock API responses and do not contact production.
After installing dependencies in both this app and the parent `frontend/`, run
`npm run test:browser` with Chrome installed (`CHROME_EXECUTABLE` overrides the
macOS default). This bundles the actual ZTA UI and DAppGenius authorization page,
intercepts all network traffic with fixtures, exercises cross-site navigation and
real SameSite cookie behavior, and saves desktop/mobile screenshots in a temporary
artifact directory. It never contacts production. PostgreSQL-backed backend tests
separately exercise the real session store, cookie routes, and migrations.

## API and browser configuration

- `VITE_ZTA_API_URL`: existing API base; production topology is
  `https://api.zta-coin.org` with the browser at `https://zta-coin.org`.
  A same-origin `/api` proxy is also supported. Authenticated API calls reject a
  different site. All balance/handoff requests use `credentials: include`,
  `cache: no-store`, no referrer, a timeout, and no automatic redirects.
- `VITE_ZTA_HANDOFF_CLIENT_ID`: exact registered client ID shared by both backends.
- `VITE_DAPPGENIUS_AUTHORIZE_URL`: `https://dappgenius.dev/zta/authorize`.
  Leave either sign-in value empty to keep sign-in unavailable.
- `VITE_DAPPGENIUS_DASHBOARD_URL`: existing dashboard navigation link.

No service secret or admin password belongs in frontend configuration.
The balance stays a decimal string with eight fractional digits. Loading,
unauthenticated, expired/revoked-session, invalid-response, and unavailable states
never show a fabricated zero or retain a previously displayed balance. Because
401 does not distinguish missing from expired cookies, an initial 401 is shown
as signed out; a 401 after a successful balance or during callback is shown as an
expired/invalid session. Revalidation occurs on focus, refresh, and every minute.

## Cross-site navigation

1. On ZTA, POST `/auth/handoff/start` sets a host-only Secure/HttpOnly/SameSite=Lax
   transaction cookie on the ZTA API. The short-lived verifier stays in this tab's
   ZTA `sessionStorage` until callback (maximum five minutes).
2. Navigate the whole tab to DAppGenius `/zta/authorize`, carrying only client ID,
   fixed redirect URI, state, and S256 challenge in the fragment. Never the verifier.
3. DAppGenius's new page verifies password plus the eight-digit email code through
   the existing strict-session API. It holds the resulting `dgs1_` credential only
   in function memory and calls `/strict-sessions/handoff/authorize` with Bearer
   strict proof. The legacy dashboard JWT is not accepted or reused.
4. Navigate back to the fixed ZTA `/auth/callback` with the one-time code and state
   in the fragment. ZTA clears the URL, validates its saved transaction, removes
   the saved verifier, and POSTs `/auth/handoff/redeem` from the ZTA site.
5. The backend requires the transaction cookie and matching state/PKCE, redeems
   server-to-server, and sets the host-only Secure/HttpOnly/SameSite=Lax session.
   ZTA then loads `/me/balance` without any account/user ID parameters.

No step expects a ZTA Lax cookie to accompany a fetch initiated on DAppGenius.
The one-time callback is consumed outside React effects to avoid StrictMode replay.
A failed or expired callback requires restarting sign-in. Browser storage must be
available and HTTPS is required for an actual cookie-backed login.

## DAppGenius integration and release prerequisites

Parent frontend `frontend/src/pages/ZtaAuthorize` reuses its existing configured
API base (`REACT_APP_ENVIRONMENT` and corresponding `REACT_APP_*_API`). Configure:

- `REACT_APP_ZTA_HANDOFF_CLIENT_ID`: same exact registered client ID.
- `REACT_APP_ZTA_HANDOFF_REDIRECT_URI`: `https://zta-coin.org/auth/callback`.

The parent route is independent of legacy dashboard login and obtains strict proof
itself. Analytics scripts are skipped on this authorization page. Both sites use
no-referrer policy. Hosting must serve the SPA at `/zta/authorize` and
`/auth/callback`; do not redirect away or discard fragments. Avoid logging
handoff request/response bodies and apply no-store headers at the edge to auth pages.

ZTA backend must set `ZTA_ALLOWED_ORIGIN=https://zta-coin.org`, the registered
client/callback, and server-only DAppGenius redemption/validation URLs and secret.
This origin takes precedence over the legacy `DAPPGENIUS_ORIGIN` setting. Auth
and balance have exact-origin credentialed CORS, including preflight; other API
routes retain their existing policy and financial lockdown.

Strict sessions remain disabled in production. Deployment still requires a
separate approved enablement/configuration process, functioning verification mail,
the strict-session/handoff and ZTA migrations, and HTTPS browser verification on
the intended deployment. This work does not deploy, run production migrations,
change financial restrictions, or grant financial write access.
