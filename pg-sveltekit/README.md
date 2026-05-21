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

   | Variable              | Description                                | Default                                                                         |
   | --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
   | `PUBLIC_PKG_URL`      | PostGuard PKG server URL                   | `https://pkg.staging.postguard.eu`                                              |
   | `PUBLIC_CRYPTIFY_URL` | Cryptify file-sharing URL                  | `https://storage.staging.postguard.eu`                                          |
   | `PUBLIC_DOWNLOAD_URL` | PostGuard website used in `/download` URLs | `https://staging.postguard.eu` on staging Cryptify, else `https://postguard.eu` |
   | `PUBLIC_APP_NAME`     | App display name                           | `PostGuard for Business Example`                                                |

## Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Staging Cryptify does not send email

The default `PUBLIC_CRYPTIFY_URL` is `storage.staging.postguard.eu` — the staging
deployment. It **does not actually deliver notification emails**, so you can exercise
the full upload + notify flow without spamming real inboxes while you integrate the SDK.

What this means for the example:

- The upload itself works. You get back a real UUID and the download URL is usable.
- The **Encrypt & Send** flow succeeds, but no email is sent to the recipient. The UI
  will surface a banner and show the download URL — open it yourself to verify the
  decrypt flow end-to-end.
- Point `PUBLIC_CRYPTIFY_URL` at the production Cryptify host to exercise real email
  delivery.

## Build

```bash
npm run build
npm run preview   # preview the production build
```
