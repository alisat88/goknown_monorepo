# Temporary ZTA token API lockdown

ZTA currently has no verified issuer authority or account ownership model. The
application router therefore denies the operations below with HTTP 403,
`code: ZTA_OPERATIONS_DISABLED`, and `Cache-Control: no-store`. This applies even
when a request supplies a bearer token, admin role, issuer name, or node-sync flag.
There is no environment switch or credential bypass.

The guard runs before legacy authentication, validation, upload/sync middleware,
controllers, and financial services. It must remain the first application-router
middleware until a reviewed replacement establishes real authorization.

## Protected surface

| Paths | Methods denied | Reason |
| --- | --- | --- |
| `/mint` and descendants | All | Public service trusts the body issuer string and returns destination balances. |
| `/transfer` and descendants | All | No sender ownership; response exposes both account balances. |
| `/ledger` and descendants | All | Unclassified global transaction history. |
| `/velocity` and descendants | All | Arbitrary account activity lookup. |
| `/me/transactions` and descendants | All | Legacy transaction creation and balance/history reads, including organization variants. |
| `/me/charges` and descendants | All | Legacy credit creation and financial records, including organization variants. |
| `/votes` and descendants | All | Transaction approval/rejection and vote deletion. |
| `/admin/users` and descendants | All | Issuance, CSV imports that alter transactions, and account administration. |
| `/auditlogs` and descendants | All | Audit messages can contain transaction/charge/login financial data. |
| `/sessions` | POST | Legacy login retrieves and returns a balance. |
| `/users` | POST | Registration invokes the same balance-reading login service. |
| `/users/invite` | POST | Invitations create charges and update legacy transactions. |
| `/organizations` | POST | Creates legacy token currency configuration. |
| `/organizations/:id` | PUT | Enables/disables legacy token currency configuration. |

Legacy routes use a JWT middleware whose secret falls back to `default`; they
cannot serve as a trusted exemption. Some legacy handlers also expect entities
not registered in the active ZTA database. Their current runtime incompatibility
is not treated as an authorization control.

Health endpoints remain available. Laboratory routes were already unmounted and
remain so. The inspected socket handler handles messages, not ledger operations.
Unrelated application routers, static assets, and their behavior are unchanged;
this patch is not an authorization audit/remediation of those other applications.

## Exposure and demo impact

`npm start`/Procfile run `dist/shared/infra/http/server.js`, which mounts the router
at `/`. Docker exposes port 3333, and the repository deployment-status document
identifies `https://api.zta-coin.org` as the API. No path-specific authorization is
shown in the inspected deployment files. Treat these paths as externally
reachable; CORS is not authorization. No live API probes were performed.

Minting, transfers, full-ledger viewing, and velocity demos are intentionally
unavailable during lockdown. The existing React mint/transfer/velocity panels
receive the explicit denial error. Its ledger loader currently suppresses fetch
errors, so it may show an empty or previously loaded ledger; a blank ledger does
not mean records were deleted. Legacy ZTA login, registration/invitation, charges,
votes, issuer/import operations, audit access, and currency changes listed above
are also unavailable. DAppGenius authentication in the main backend is unchanged.

No accounts, balances, ledger entries, migrations, secrets, or database
configuration are changed. Existing demo data is preserved. No personal accounts
or balance UI are added. Internal financial services remain unchanged and must
not be exposed through new routes or other transports without authorization.

## Verification and deployment

Run `npm run test:lockdown` on Node 22 or newer. It loads the actual application
router and four actual public token routers, mocks downstream services/legacy
routers, and uses only an ephemeral localhost HTTP listener. Database imports
are prohibited by the test harness. Do not substitute `npm run test:zta`, which
writes to a configured database and mints into `KNOWN_SYSTEM`.

After approval, build with `npm run build` and deploy the patched build to every
ZTA API instance. No new credentials, infrastructure, or migrations are required.
Old running instances retain the vulnerabilities until replaced. Previously
disclosed or cached data cannot be recalled by this patch.

Review checks: unauthenticated and forged-credential requests to every protected
path return the denial without financial data; health endpoints still work;
no downstream financial service is called; and unrelated staged work is unchanged.
Use mocks or an isolated environment for POST/PUT/DELETE checks, not production
mint/transfer probes.

Phase 2 should establish an authenticated, short-lived, atomically single-use
DAppGenius-to-ZTA handoff, a ZTA-specific session, authoritative active-user
validation, database-enforced ownership and demo separation, issuer privileges,
exact decimal responses, and concurrency-safe balance writes before any financial
endpoint is reopened. Reopening the current services unchanged would restore the
authorization, recipient-balance disclosure, precision, and concurrency risks.
