# pg-sveltekit — PostGuard SvelteKit Example

Example SvelteKit web application demonstrating how to use the [`@e4a/pg-js`](https://github.com/encryption4all/postguard-js) SDK for the **PostGuard for Business** use case.

## What it does

1. **Encrypt & Send** — Encrypts files for a citizen (exact email) and an organisation (email domain), uploads to Cryptify, and sends an email notification to the recipient.
2. **Decrypt & Download** — Opens an encrypted file from a Cryptify UUID, verifies the recipient's identity via Yivi, and downloads the decrypted files.

## Prerequisites

- Node.js 18+
- A PostGuard API key

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file and fill in your API key:

   ```bash
   cp .env.example .env
   ```

   ```sh
   # Public (available in browser)
   PUBLIC_PKG_URL=https://pkg.staging.postguard.eu
   PUBLIC_CRYPTIFY_URL=https://fileshare.staging.postguard.eu
   PUBLIC_APP_NAME=PostGuard for Business Example

   # Server-only
   PG_API_KEY=PG-API-your-key-here
   ```

## Run

```bash
npm run dev
```

## How it works

The app initializes a `PostGuard` instance with the PKG and Cryptify URLs, then uses the `Sealed` builder pattern for encryption and the `Opened` builder for decryption:

```ts
import { PostGuard } from '@e4a/pg-js';

const pg = new PostGuard({ pkgUrl: PKG_URL, cryptifyUrl: CRYPTIFY_URL });

// Encrypt files and upload to Cryptify
const sealed = pg.encrypt({
  files,
  recipients: [
    pg.recipient.email('citizen@example.com'),
    pg.recipient.emailDomain('info@org.nl')
  ],
  sign: pg.sign.apiKey(apiKey),
});
const { uuid } = await sealed.upload({ notify: { message: 'Your files' } });

// Decrypt from a Cryptify UUID
const opened = pg.open({ uuid });
const result = await opened.decrypt({ element: '#yivi-web' });
result.download();
```

See the [PostGuard documentation](https://github.com/encryption4all/postguard-docs) for full SDK reference.
