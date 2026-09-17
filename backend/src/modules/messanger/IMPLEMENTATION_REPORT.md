# Messenger hardening and group conversations

> The multi-node follow-up in [MULTINODE_REPORT.md](MULTINODE_REPORT.md) supersedes the process-local Socket.io and HTTP mirroring details below.

## Architecture and security

The active PostgreSQL model stores messages inside `conversations.messages` (`jsonb[]`), not in a separate Message table. The MongoDB `schemas/` files are legacy and were not changed. Conversation members are user `sync_id` values. The list API retains its existing user-with-conversation shape for direct contacts and adds group entries with the same frontend shape.

- Socket handshakes send the existing `@GoKnown:token` as `auth.token`. The server verifies it with the existing `authConfig.jwt.secret`, looks up the JWT subject via `UsersRepository.findBySyncId`, requires an active account, and derives identity from that record. Login already puts `user.sync_id` in the JWT subject.
- Each authenticated socket joins `messenger:user:<sync_id>`. Multiple tabs/devices join the same user room. Connections expire with their JWT; unauthenticated connections are rejected. Tokens are not logged.
- `addUser` can request presence, but its arguments cannot choose identity. The authoritative `sendMessage` socket relay was removed.
- MessageController derives sender exclusively from `request.user.sync_id`. Its HTTP service checks existence and membership. The repository rechecks membership under a row lock, persists once, updates unread, and commits. Only afterward does the controller emit the saved message.
- `getMessage` contains the actual persisted message and `conversation_id` equal to the canonical conversation `sync_id`. Every other member's room receives it; the sender's room receives no message copy. Existing `newMessage` is retained. `conversationsChanged` invalidates conversation lists and unread summaries.
- History retrieval checks user existence and membership before accessing messages or clearing unread. Both read and write reject nonmembers with 403. Listing is restricted to the authenticated member; direct lookup excludes groups even when participants overlap.
- SQL appends use a bound `:message` JSON parameter rather than interpolating text. The append and unread update share one transaction. History and read acknowledgement also share one transaction and lock the row, preventing stale read-modify-write overwrites.

## Unread

`unread[index]` corresponds to `members[index]`. Creation initializes one zero per member. Sending leaves the sender's count unchanged and increments every other member. Retrieving history clears only the requesting member's entry without changing conversation ordering. The frontend obtains totals from authenticated `GET /conversations/unread`; socket events, reconnect, and window focus trigger refreshes rather than inventing counts locally. History is routed and refreshed by conversation ID, so an overlapping direct/group sender cannot contaminate another chat.

## Database and migration

Read-only `information_schema.columns` inspection of the configured localhost development database returned no `public.conversations` table. No existing/deployed Messenger column types were therefore verified. The checked-in `1683855442023-CreateConversationsTable` defines `members` and `unread` as `jsonb`, and `messages` as `jsonb[]`. The entity now matches that migration. No array-conversion migration was added.

`1789400000000-AddMessengerGroupMetadata.ts` adds only:

| Column | PostgreSQL type | Default |
| --- | --- | --- |
| type | varchar, not null | 'direct' |
| name | varchar, nullable | null |
| created_by | uuid, nullable | null |

No messages or conversations are deleted or rewritten. Old frontend records with absent type are treated as direct. No new Message table exists. `synchronize` remains false. This migration was added but **not run**. Apply it through the existing TypeORM migration process before starting the updated backend; verify the target database's actual column types read-only first.

The PostgreSQL tests used a connection-local TEMP table matching the migration types, which disappeared on connection close. They did not modify permanent application tables or run application migrations.

## Group API and validation

Existing `POST /conversations` is preserved. New `POST /conversations/group` accepts:

```json
{"name":"Engineering Team","emails":["alice@example.com","bob@example.com"]}
```

Celebrate/Joi trims and validates the name (1–100 characters) and email array (2–49 invitees). Email syntax is validated before canonicalization. Login and group lookup share `shared/utils/canonicalizeAccountEmail.ts`: trim, strip plus aliases, and locale-lowercase, exactly preserving the existing login account semantics. Signup and the pre-existing signup/whitelist edits were not modified.

Duplicates are rejected after canonicalization. The creator cannot invite themselves and is automatically included. Every invitee must resolve through `findByEmail` to `status === 'active'`. All invitees are checked before insertion; failures create nothing. Invalid/inactive/unavailable accounts receive a useful address-specific error, with inactive and nonexistent accounts described identically. Groups contain 3–50 total members.

Existing asynchronous node mirroring is reused for groups. Optional validated `sync_id`/`masterNode` fields support that protocol. A mirrored identifier cannot overwrite a different conversation. Messenger's generated sync identifiers now use UUID v4 instead of name/timestamp derivation, avoiding same-millisecond collisions without requiring new environment configuration.

## Frontend

Messenger retains the existing sidebar, avatars, bubbles, composer, and navigation. A Create Group dialog adds/removes participant emails, validates obvious errors, displays backend validation failures, and opens the new group after creation. Groups use their name, an icon/member count, and authorized participant display names on received messages. The separate Groups/Organizations applications are unchanged; group controls are limited to the normal Messenger, not room-scoped views.

The socket provider now owns one stable connection, supplies the existing token on login, and disconnects on logout/token change. DefaultLayout uses the Messenger unread hook in place of incrementing local badges from untrusted events. Direct contacts and old conversation records retain direct rendering. Failed operations display errors instead of silently dropping them.

## Verification

Commands run from their respective root `backend/` or `frontend/` directories:

| Command | Result |
| --- | --- |
| Backend `npm test -- --runInBand src/modules/messanger/__tests__` | 18 passed |
| Backend `npm test -- --runInBand --testMatch '**/messenger-postgres.integration.ts'` | 3 passed against a localhost TEMP table |
| Backend `npm test -- --runInBand --testMatch '**/messenger-socket.integration.ts'` | 2 passed with an isolated localhost Socket.io server and fake users |
| Frontend `npm test -- --watchAll=false --runInBand src/pages/Messenger/__tests__/messenger.test.tsx` | 7 passed |
| Backend `npm run build` | Passed, Babel compiled 442 source files |
| Frontend `npm run build` | Passed with repository lint/bundle warnings |
| Frontend `tsc --noEmit --types react,react-dom,jest --skipLibCheck` | Passed |
| Frontend focused ESLint on Messenger, socket, unread hook, DefaultLayout | Passed |
| `git diff --check` | Passed |

The default backend `tsc --noEmit` already failed before edits because root-level JavaScript config files fall outside `rootDir: src`. An expanded check (`tsc --noEmit --rootDir . --types node,jest --skipLibCheck`) still reports 41 existing diagnostics elsewhere. Comparison with an isolated copy of the exact pre-task source yielded 45 baseline diagnostics: four Messenger/socket errors were fixed and no new diagnostics were introduced (normalizing temporary-directory paths). The existing errors include MailProvider typings, missing identifiers, nullable user fields, and unrelated consensus/payment types.

The default frontend `tsc --noEmit` already failed before edits because its tsconfig names missing `react/next` and `react-dom/next` types. Supplying the installed type names explicitly passes. Those shared configurations were not changed. Frontend tests emit the existing React 18/testing-library render deprecation warning. The first local integration attempts were blocked by sandbox networking; the same commands passed after approved localhost access.

Tests cover direct creation, membership denial, JWT-derived identity, missing/invalid authentication, no socket injection, multiple recipient devices, persisted payload delivery after commit, failed persistence producing no event, apostrophes/SQL-looking text, group validation failures without partial creation, separate direct/group list entries and routing, per-member unread, saved history reload, frontend errors, direct sending, and opening newly created groups.

## Remaining limits

- Existing production column types were not inspected; the entity alignment follows the checked-in migration and was exercised against a TEMP table. Verify target types before migration/rollout.
- Node mirroring remains the existing best-effort asynchronous mechanism; no distributed transaction, retry queue, or cross-node integration test was introduced. Peer nodes need the metadata migration and updated code. WebSocket delivery remains process-local, consistent with the existing deployment; multiple backend workers would need a shared Socket.io adapter.
- Historical unread values were previously maintained with incorrect semantics and no durable read acknowledgements. They cannot be reconstructed reliably. Existing values are preserved and each member's entry becomes authoritative as they read; new writes use the corrected semantics.
- Embedded message history and full-history reads remain the existing design. Large conversations can make reads/row-lock transactions expensive; pagination and a separate message store were deliberately outside this change.
- HTTP retry idempotency and guaranteed delivery across a process crash after commit remain outside the existing architecture. Reload/reconnect reads committed history, so missed transient socket events do not lose saved messages.
- No production data, environment variables, deployments, commits, pushes, staging, or copied applications were changed. A full browser session against a populated application database was not available; tests exercised frontend rendering, the actual SQL repository, and real local sockets separately.

## All files changed by this task

- `backend/src/modules/messanger/IMPLEMENTATION_REPORT.md`
- `backend/src/modules/messanger/__tests__/delivery.test.ts`
- `backend/src/modules/messanger/__tests__/groups.test.ts`
- `backend/src/modules/messanger/__tests__/messenger-security.test.ts`
- `backend/src/modules/messanger/dtos/ICreateConversationDTO.ts`
- `backend/src/modules/messanger/dtos/groupConversationSchema.ts`
- `backend/src/modules/messanger/infra/http/controllers/ConversationController.ts`
- `backend/src/modules/messanger/infra/http/controllers/MessageController.ts`
- `backend/src/modules/messanger/infra/http/middlewares/syncNodeMessanger.ts`
- `backend/src/modules/messanger/infra/http/routes/conversations.routes.ts`
- `backend/src/modules/messanger/infra/typeorm/entities/Conversation.ts`
- `backend/src/modules/messanger/infra/typeorm/repositories/ConversationsRepository.ts`
- `backend/src/modules/messanger/infra/typeorm/repositories/MessagesRepository.ts`
- `backend/src/modules/messanger/messenger-postgres.integration.ts`
- `backend/src/modules/messanger/messenger-socket.integration.ts`
- `backend/src/modules/messanger/repositories/IMessagesRepository.ts`
- `backend/src/modules/messanger/services/CreateGroupConversationService.ts`
- `backend/src/modules/messanger/services/CreateNewMessageService.ts`
- `backend/src/modules/messanger/services/FindConversationsService.ts`
- `backend/src/modules/messanger/services/GetUnreadService.ts`
- `backend/src/modules/messanger/services/ListAllUserConversationsService.ts`
- `backend/src/modules/messanger/services/ListAllUserMessagesService.ts`
- `backend/src/modules/users/services/AuthenticateUserService.ts`
- `backend/src/shared/infra/http/socketIO.ts`
- `backend/src/shared/infra/typeorm/migrations/1789400000000-AddMessengerGroupMetadata.ts`
- `backend/src/shared/utils/canonicalizeAccountEmail.ts`
- `frontend/src/hooks/messengerUnread.ts`
- `frontend/src/hooks/socket.tsx`
- `frontend/src/pages/Messenger/CreateGroupDialog.tsx`
- `frontend/src/pages/Messenger/__tests__/messenger.test.tsx`
- `frontend/src/pages/Messenger/index.tsx`
- `frontend/src/pages/Messenger/styles.ts`
- `frontend/src/pages/Messenger/types.ts`
- `frontend/src/pages/_layouts/DefaultLayout.tsx`

## Pre-existing workspace files left untouched

All of the following were present before this task and verified byte-for-byte unchanged with SHA-256:

- `backend/src/modules/digitalassets/__tests__/folders.test.ts`
- `backend/src/modules/digitalassets/infra/http/controller/FoldersController.ts`
- `backend/src/modules/digitalassets/infra/http/routes/folders.routes.ts`
- `backend/src/modules/digitalassets/infra/typeorm/repositories/FoldersRepository.ts`
- `backend/src/modules/digitalassets/repositories/IFoldersRepository.ts`
- `backend/src/modules/digitalassets/services/FindFolderService.ts`
- `backend/src/modules/digitalassets/services/ListAllFoldersService.ts`
- `backend/src/modules/digitalassets/services/ListEligibleParticipantsService.ts`
- `backend/src/modules/digitalassets/services/UpdateFolderService.ts`
- `backend/src/modules/users/services/CreateUserService.ts`
- `backend/src/modules/users/utils/emailWhitelist.ts`
- `frontend/src/pages/DigitalAssets/Folder/index.tsx`
- `frontend/src/pages/DigitalAssets/__tests__/digital-assets.test.tsx`
- `frontend/src/pages/DigitalAssets/__tests__/folder-participants.test.tsx`
- `frontend/src/pages/DigitalAssets/index.tsx`

## git diff --stat

This is the raw tracked-file diff, including the 11 pre-existing modified files. Git does not include new untracked files in this output; the complete task file list above includes them. Nothing was staged.

```text
 .../infra/http/controller/FoldersController.ts     |  18 +
 .../infra/http/routes/folders.routes.ts            |  20 +
 .../typeorm/repositories/FoldersRepository.ts      |   8 +
 .../repositories/IFoldersRepository.ts             |   1 +
 .../digitalassets/services/FindFolderService.ts    |  39 +-
 .../services/ListAllFoldersService.ts              |   7 +-
 .../digitalassets/services/UpdateFolderService.ts  |   6 +-
 .../messanger/dtos/ICreateConversationDTO.ts       |   6 +-
 .../http/controllers/ConversationController.ts     |  31 ++
 .../infra/http/controllers/MessageController.ts    |  10 +
 .../infra/http/middlewares/syncNodeMessanger.ts    |  10 +-
 .../infra/http/routes/conversations.routes.ts      |  19 +
 .../infra/typeorm/entities/Conversation.ts         |  13 +-
 .../repositories/ConversationsRepository.ts        |   5 +-
 .../typeorm/repositories/MessagesRepository.ts     |  87 ++-
 .../messanger/repositories/IMessagesRepository.ts  |   4 +-
 .../messanger/services/CreateNewMessageService.ts  |  20 +-
 .../messanger/services/FindConversationsService.ts |   8 +-
 .../services/ListAllUserConversationsService.ts    | 158 +++---
 .../services/ListAllUserMessagesService.ts         |  12 +-
 .../users/services/AuthenticateUserService.ts      |   6 +-
 .../modules/users/services/CreateUserService.ts    |  29 +-
 backend/src/shared/infra/http/socketIO.ts          | 154 ++---
 frontend/src/hooks/socket.tsx                      |  26 +-
 frontend/src/pages/DigitalAssets/Folder/index.tsx  |  45 +-
 .../__tests__/digital-assets.test.tsx              |  75 +++
 frontend/src/pages/DigitalAssets/index.tsx         |  19 +-
 frontend/src/pages/Messenger/index.tsx             | 617 +++++++++------------
 frontend/src/pages/Messenger/styles.ts             |  10 +
 frontend/src/pages/_layouts/DefaultLayout.tsx      |  46 +-
 30 files changed, 849 insertions(+), 660 deletions(-)
```
