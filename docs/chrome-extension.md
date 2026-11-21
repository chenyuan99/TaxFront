# TaxFront Companion Chrome Extension — Design

Status: **proposed, not built.** This document is the design to argue with before any code exists.

## The problem worth solving

Tax documents do not start life on a user's disk. They live behind logins — a payroll portal, a brokerage, a bank, a university bursar. Getting one into TaxFront today means: find the download link, save it, remember where it went, open taxfront.io, drag it in. Every step is a place to give up, and the tab that would have shown the result is not the tab the user is in.

An extension collapses that to one click from the page the document is already on, and puts processing results in front of the user wherever they are browsing.

## Goals

1. **Capture** a tax document from any page — a PDF being viewed, or a link to one — into TaxFront, with the extraction pipeline running exactly as it does for a drag-and-drop upload.
2. **Surface** job outcomes (`Document processed` / `Document processing failed`) without a TaxFront tab open.
3. **Glance** at the current tax picture — document count, unread notifications, in-flight jobs — from the toolbar.

## Non-goals

- **Not a second frontend.** No tax calculator, no agent chat, no document browser. Those live in the web app; the extension deep-links to them.
- **No scraping of portal pages.** The extension does not log into anyone's payroll provider or walk a DOM looking for wage figures. It captures files the user points at. Anything else is a support and liability problem disproportionate to the benefit.
- **No form filling.** See `TASKS.md`.

## The central design claim

**The extension should be a pure client of infrastructure that already exists.** No new Cloud Functions, no new collections, no changes to the extraction pipeline.

This is achievable because the web app's upload path is already just two client-side writes:

```
1. PUT   file  → Storage at users/{uid}/{timestamp}_{cleanFileName}
2. CREATE doc  → taxDocuments/ with { name, type, size, uploadDate, url, userId, status: 'pending' }
```

`processNewTaxDocument` fires on step 2 and everything downstream — Gemini extraction, the `jobs` record, the `notifications` row, FCM fan-out — happens with no knowledge of what created the document. An extension that performs those same two writes inherits the entire pipeline for free.

Any design that requires backend changes should be treated as suspect and re-derived.

## Architecture

```
┌──────────────────────────────────────────────┐
│ Chrome (MV3)                                 │
│                                              │
│  content script ──┐                          │
│  (detect PDFs)    │                          │
│                   ▼                          │
│  service worker (chrome.alarms driven)       │
│    ├── capture: fetch blob → upload → create │
│    ├── poll:    notifications since cursor   │
│    └── notify:  chrome.notifications         │
│                   │                          │
│  popup (React)    │  chrome.storage.session  │
│    └── summary, recent activity, deep links  │
└───────────────────┼──────────────────────────┘
                    │  HTTPS, user's own ID token
                    ▼
     Firebase Storage · Firestore REST · Identity Toolkit
                    │
                    ▼
     processNewTaxDocument (unchanged)
```

### Why REST, not the Firebase JS SDK

The Firebase JS SDK expects a DOM and IndexedDB. An MV3 service worker has neither, and the documented workaround — an `chrome.offscreen` document hosting the SDK — adds a second runtime, its lifecycle, and message-passing between them, to obtain persistence the extension does not need.

The extension makes perhaps five distinct API calls. Against Firestore REST, Storage REST, and Identity Toolkit's `token` endpoint, that is a few hundred lines with no bundled SDK, no offscreen document, and no MV3 friction. **Use REST.**

The cost is real and should be acknowledged: hand-rolled Firestore value encoding (`{stringValue: …}`, `{integerValue: …}`) is tedious and easy to get subtly wrong. Confine it to one module with tests, mirroring the shapes in `functions/src/jobs.ts`.

## Authentication

The hard problem, and the one most likely to be got wrong.

**Rejected — a second Google sign-in** via `chrome.identity.launchWebAuthFlow`. It works, but it asks the user to authenticate to a thing they just authenticated to, and creates an identity path that can drift from the web app's.

**Rejected — reading the web app's session.** Firebase Auth persists to IndexedDB under the taxfront.io origin. An extension cannot reach another origin's IndexedDB without injecting a script into that page, which is a fragile dependency on internal SDK storage layout.

**Proposed — a custom-token handshake, mediated by the web app.**

```
1. Extension opens https://taxfront.io/link-extension?ext=<extension id>
2. Page requires an existing signed-in session (normal web app auth)
3. User clicks "Connect extension" — an explicit, revocable grant
4. Page calls a new callable, createExtensionToken, which returns a
   Firebase custom token minted for request.auth.uid
5. Page hands it to the extension via chrome.runtime.sendMessage,
   permitted by "externally_connectable": ["https://taxfront.io/*"]
6. Extension exchanges it at Identity Toolkit signInWithCustomToken
   for an ID token + refresh token, stores the refresh token, and
   refreshes on demand
```

This is the one place the claim of *no backend changes* does not hold: `createExtensionToken` is new. It is ~15 lines using `getAuth().createCustomToken(uid)` and is the smallest possible surface for the problem.

Its security properties deserve stating: the custom token is short-lived and single-use, it is minted only for the caller's own uid, and the grant is an explicit user action on a first-party page. A revocation path — clearing the extension's stored tokens and, if needed, `revokeRefreshTokens(uid)` — must ship with it, not after.

**Token storage.** The refresh token goes in `chrome.storage.local`; ID tokens are cached in `chrome.storage.session` and never persisted. `chrome.storage.local` is readable by anyone with filesystem access to the Chrome profile — no worse than the web app's IndexedDB session, and worth saying plainly in the store listing rather than implying otherwise.

## Notifications

`pushNewNotification` already fans a notification row out to every token under `users/{uid}/fcmTokens/*` and prunes dead ones. Registering the extension as another device is the obvious move — and the design should **not** do it yet.

Chrome extensions obtain FCM registration tokens through `chrome.gcm.register()`, whose relationship to the modern FCM HTTP v1 `token` target is not something to assume works. Building the notification story on that, discovering it does not, and having to retrofit polling is the expensive order to find out.

**Ship polling first.** A `chrome.alarms` tick (default 5 minutes, user-configurable 1–15) queries:

```
notifications where userId == {uid} and createdAt > {cursor} order by createdAt
```

New rows become `chrome.notifications` entries; clicking one opens `/jobs`. The cursor lives in `chrome.storage.local`. This reuses the composite index that already exists on (`userId` asc, `createdAt` desc) — no new index, no new backend.

The tradeoff is latency: up to five minutes rather than seconds. For "your W-2 finished processing" that is acceptable, and it is honest about MV3, where a service worker terminates after ~30 seconds idle and a long-lived listener is not available regardless.

**Then evaluate FCM as a follow-up**, with polling as the fallback that already works. If `chrome.gcm` proves viable, the extension registers a token into `users/{uid}/fcmTokens/{token}` and the existing backend delivers to it with no change — including dead-token pruning, since `sendPushToUser` already handles `registration-token-not-registered`.

## Capture flow

Three entry points, all user-initiated:

| Trigger | Behavior |
|---|---|
| Toolbar click on a PDF tab | Capture the document being viewed |
| Right-click a link → "Send to TaxFront" | Capture the link target |
| Right-click page → "Send to TaxFront" | Capture the current URL |

Then:

1. `fetch(url, { credentials: 'include' })` in the service worker, so portal session cookies apply and the download works exactly as it would for the user.
2. Validate: `application/pdf` or `image/{png,jpeg}`, under 10MB — matching `DocumentUpload.tsx`.
3. `PUT` to Storage at `users/{uid}/{timestamp}_{cleanFileName}`, with `customMetadata.uploadedBy = uid` and, additionally, `source: 'extension'`.
4. `POST` the `taxDocuments` row with `status: 'pending'`.
5. Badge the toolbar icon; the poller reports the outcome.

Step 1 is where this earns its keep: the file never touches the user's disk, and no download-then-upload dance is required.

**`source: 'extension'` is worth adding** even though nothing reads it yet. When someone later asks whether the extension is used, the answer should be a query rather than a guess.

## Permissions

Minimal, and each justified in the store listing:

| Permission | Why |
|---|---|
| `storage` | Tokens, cursor, settings |
| `alarms` | Notification polling |
| `notifications` | Surfacing job outcomes |
| `contextMenus` | The capture entry points |
| `activeTab` | Read the current tab's URL, only on user click |
| `host_permissions` | `firestore.googleapis.com`, `firebasestorage.googleapis.com`, `identitytoolkit.googleapis.com`, `securetoken.googleapis.com` |
| `externally_connectable` | `https://taxfront.io/*` only |

**Deliberately excluded:** `<all_urls>`, `tabs`, `webRequest`, `cookies`, and any persistent content script. `activeTab` grants access only in response to a click, which is the correct shape for a capture action and keeps the extension out of every page the user visits.

A permissions review will ask why a tax product wants to read pages. The answer must be "it doesn't" — and the manifest has to back that up.

## Privacy

This handles W-2s and 1099s. The bar is higher than for a normal extension.

- Captured files go to the user's own Firebase Storage and nowhere else. No extension-operated server exists.
- No page content is read, transmitted, or stored. Only the URL of a file the user explicitly selected.
- No analytics in v1. If added later, no URLs and no document metadata.
- Disconnecting clears all local state and revokes the refresh token.

## Phasing

**Phase 1 — capture.** Auth handshake, `createExtensionToken`, context menus, upload, badge feedback. Shippable and independently useful; a user who never opens the popup still gets the main benefit.

**Phase 2 — awareness.** Alarm-driven polling, `chrome.notifications`, popup with summary and recent activity via `getTaxSummary`.

**Phase 3 — evaluate FCM.** Only after 1 and 2 work.

## Repository layout

A new top-level `extension/` workspace, sibling to `frontend/` and `functions/`, with its own `package.json`, Vite + `@crxjs/vite-plugin` build, and Vitest suite. It shares no build with the frontend; `chrome-types` moves from `frontend/package.json` (where it is currently an unused devDependency) to `extension/`.

## Open questions

1. **Does `chrome.gcm` interoperate with FCM HTTP v1 token targets?** Determines whether Phase 3 exists. Answer with a spike, not a reading of the docs.
2. **Should capture be allowed while signed out**, queuing locally until connected? Better first-run experience, but means holding tax documents in `chrome.storage` — probably not worth it.
3. **Does the extension need its own App Check story?** The web app uses reCAPTCHA Enterprise, which does not apply to an extension origin. If App Check enforcement is ever turned on for Firestore, extension requests would be rejected. This must be settled before enforcement, not after — see the note in `CLAUDE.md` about App Check being effectively inert in production today.
4. **Chrome Web Store review.** A tax-document extension requesting host permissions should expect scrutiny and a possible privacy-policy requirement. Budget for a review cycle.

## Relationship to existing docs

- `DESIGN.md` describes the system, but its backend sections are stale — they document the Python Flask backend removed in `71a6563`. Do not use it as the reference for how uploads work; `CLAUDE.md` and the code are current.
- `docs/open-policy-agent.md` is the model for this document's format: a proposal with its rejection criteria stated.
