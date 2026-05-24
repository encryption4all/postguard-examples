# pg-node: PostGuard Node.js example

Node.js example demonstrating how to use the [@e4a/pg-js](https://www.npmjs.com/package/@e4a/pg-js) SDK from a server runtime. Mirrors the [pg-sveltekit](../pg-sveltekit) example's "Informatierijk notificeren" flow (citizen + organisation recipients) but as a CLI script — drop-in starting point for backend integrations.

## What it does

Two modes, selected by the script flag:

1. **Send** (`npm run send`) — encrypts the input files for a citizen (exact email) and an organisation (email domain), uploads to Cryptify, and asks Cryptify to email each recipient a download link.
2. **Upload-only** (`npm run upload`) — same encryption + upload, but silent. Cryptify returns a UUID you can distribute through some other channel.

Files come from `PG_INPUT_FILES` (comma-separated paths) or two in-memory demo files if that is unset.

## Prerequisites

- **Node.js 20.6+** — older versions lack `--env-file-if-exists` (used by `npm start`) and the `File` global (used by the SDK). Node 22 LTS recommended. The SDK itself supports Node 20.3+, Bun, and Deno.
- A PostGuard for Business API key.

## Setup

```bash
cd pg-node
npm install
cp .env.example .env
# edit .env: set at minimum PG_API_KEY
```

The `package.json` depends on the SDK via `file:../../postguard-js`, so any local changes you make to the SDK take effect after `cd ../../postguard-js && npm run build` followed by `cd ../postguard-examples/pg-node && npm install`. Swap that to `"^X.Y.Z"` once a real release is published.

## Run

```bash
npm run send       # encrypt + upload + ask Cryptify to send mails
npm run upload     # encrypt + upload silently, no mails
```

The script prints the resulting `uuid` and the corresponding `…/download?uuid=…` URL.

## Staging Cryptify does not send email

The default `PG_CRYPTIFY_URL` is `storage.staging.postguard.eu` — the staging deployment. It **does not actually deliver notification emails**, so you can exercise the full upload + notify flow without spamming real inboxes while you integrate.

- The upload itself works. You get back a real UUID and the download URL is usable.
- `npm run send` succeeds, but no recipient mail is sent. Open the printed URL yourself to verify the decrypt flow end-to-end.
- Point `PG_CRYPTIFY_URL` at the production Cryptify host to exercise real email delivery.

## Configuration

| Variable                | Description                                           | Default                                                                            |
| ----------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `PG_API_KEY`            | PostGuard for Business API key (`PG-…`)               | *(required)*                                                                       |
| `PG_PKG_URL`            | PostGuard PKG server URL                              | `https://pkg.staging.postguard.eu`                                                 |
| `PG_CRYPTIFY_URL`       | Cryptify file-sharing URL                             | `https://storage.staging.postguard.eu`                                             |
| `PG_DOWNLOAD_URL`       | PostGuard website used in `/download` URLs            | `https://staging.postguard.eu` on staging Cryptify, else `https://postguard.eu`    |
| `PG_CITIZEN_EMAIL`      | Citizen recipient (exact email match)                 | `citizen@example.com`                                                              |
| `PG_ORGANISATION_EMAIL` | Organisation recipient (matches by domain)            | `noreply@example.org`                                                              |
| `PG_MESSAGE`            | Optional unencrypted body for Cryptify's notify mail  | *(empty)*                                                                          |
| `PG_INPUT_FILES`        | Comma-separated file paths to encrypt                 | two in-memory demo files                                                           |

## How it maps to the SDK

The work happens in [`src/encryption.mjs`](./src/encryption.mjs):

```js
const sealed = pg.encrypt({
  files,
  recipients: [pg.recipient.email(citizen.email), pg.recipient.emailDomain(organisation.email)],
  sign: pg.sign.apiKey(apiKey),
  onProgress,
  signal,
});
const { uuid } = await sealed.upload({ notify: { recipients: true, message, language: 'EN' } });
```

`notify` must be nested under an object — the SDK validates the shape and throws a clear `TypeError` if you pass `{ notify: true }` or forget to nest. See the [SDK README](https://github.com/encryption4all/postguard-js#server-side-usage-node-bun-deno) for the full server-side surface.
