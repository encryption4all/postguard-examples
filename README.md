# <p align="center"><img src="./img/pg_logo.svg" height="128px" alt="PostGuard" /></p>

> For full documentation, visit [docs.postguard.eu](https://docs.postguard.eu).

Example applications demonstrating PostGuard integration. Contains reference implementations for developers building on PostGuard. Code snippets in docs.postguard.eu come from this repo.

There are three sub-projects:

- `pg-sveltekit/`: SvelteKit web app using the `@e4a/pg-js` SDK.
- `pg-dotnet/`: .NET console app using the `postguard-dotnet` SDK.
- `pg-manual/`: manual encryption/decryption using the `@e4a/pg-wasm` library directly.

Each sub-project has its own README with full setup instructions.

## Development

### SvelteKit example

```bash
cd pg-sveltekit
npm install
npm run dev
```

See [pg-sveltekit/README.md](pg-sveltekit/README.md) for environment variables and build instructions.

### .NET example

Requires the .NET 10.0+ SDK and a PostGuard API key. The example uses the `E4A.PostGuard` NuGet package, so no Rust toolchain or local build of the native library is needed.

```bash
cd pg-dotnet
export PG_API_KEY="PG-your-key-here"
dotnet run
```

See [pg-dotnet/README.md](pg-dotnet/README.md) for full setup instructions.

### pg-manual example

```bash
cd pg-manual
npm install
npm run dev
```

See [pg-manual/README.md](pg-manual/README.md) for details.

## Releasing

No releases. This is example code.

## License

MIT
