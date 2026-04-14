# pg-sveltekit — PostGuard SvelteKit Example

Example SvelteKit web app demonstrating how to use the [@e4a/pg-js](https://www.npmjs.com/package/@e4a/pg-js) SDK for the **Informatierijk notificeren** use case.

## What it does

A single-page app with two delivery modes:

1. **Encrypt & Send** — Encrypts files for a citizen (exact email) and an organisation (email domain), uploads to Cryptify, and sends an email notification to the recipients.
2. **Encrypt & Upload** — Same encryption and upload, but returns a UUID so you can distribute the download link yourself.

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
   # Edit .env with your PG_API_KEY
   ```

   Available variables (see `.env.example`):

   | Variable              | Description                     | Default                                  |
   | --------------------- | ------------------------------- | ---------------------------------------- |
   | `PG_API_KEY`          | PostGuard API key (server-only) | _(required)_                             |
   | `PUBLIC_PKG_URL`      | PostGuard PKG server URL        | `https://pkg.staging.postguard.eu`       |
   | `PUBLIC_CRYPTIFY_URL` | Cryptify file-sharing URL       | `https://fileshare.staging.postguard.eu` |
   | `PUBLIC_APP_NAME`     | App display name                | `PostGuard for Business Example`         |

## Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview   # preview the production build
```
