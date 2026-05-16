# pg-sveltekit: PostGuard SvelteKit example

Example SvelteKit web app demonstrating how to use the [@e4a/pg-js](https://www.npmjs.com/package/@e4a/pg-js) SDK for the **Informatierijk notificeren** use case.

## What it does

A single-page app with two delivery modes:

1. **Encrypt & Send**: encrypts files for a citizen (exact email) and an organisation (email domain), uploads to Cryptify, and sends an email notification to the recipients.
2. **Encrypt & Upload**: same encryption and upload, but returns a UUID so you can distribute the download link yourself.

## Prerequisites

- Node.js 18+
- A PostGuard API key

## Setup

1. **Install dependencies**:

   ```bash
   cd pg-sveltekit
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Available variables (see `.env.example`):

   | Variable              | Description               | Default                                  |
   | --------------------- | ------------------------- | ---------------------------------------- |
   | `PUBLIC_PKG_URL`      | PostGuard PKG server URL  | `https://pkg.staging.postguard.eu`       |
   | `PUBLIC_CRYPTIFY_URL` | Cryptify file-sharing URL | `https://storage.staging.postguard.eu`   |
   | `PUBLIC_APP_NAME`     | App display name          | `PostGuard for Business Example`         |

## Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Staging email mode

The default `PUBLIC_CRYPTIFY_URL` points at `storage.staging.postguard.eu`, which runs with
[`staging_mode = true`](https://github.com/encryption4all/cryptify). For the **Encrypt & Send**
flow, Cryptify **logs** the recipient/sender email it would have sent
(a `[STAGING] Email NOT sent ...` line containing recipients, sender, expiry, and download URL)
instead of contacting SMTP. The upload flow still returns success and the download link works.

So on staging, the **Encrypt & Send** UI succeeds but no email lands in a real inbox — verify
the behaviour via the Cryptify server logs. Point `PUBLIC_CRYPTIFY_URL` at the production URL
to exercise real email delivery.

## Build

```bash
npm run build
npm run preview   # preview the production build
```
