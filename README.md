# postguard-examples

> For full documentation, visit [docs.postguard.eu](https://docs.postguard.eu/repos/postguard-examples).

Example applications demonstrating PostGuard integration. Contains reference implementations for developers building on PostGuard. Code snippets in docs.postguard.eu come from this repo.

There are two sub-projects:

- **pg-sveltekit/** -- SvelteKit web app using the `@e4a/pg-js` SDK.
- **pg-dotnet/** -- .NET console app using the `postguard-dotnet` SDK.

## Development

### SvelteKit example

```bash
cd pg-sveltekit
npm install
npm run dev
```

### .NET example

Requires .NET 8.0+ SDK, a Rust toolchain, and a PostGuard API key.

```bash
cd pg-dotnet
dotnet run
```

See [pg-dotnet/README.md](pg-dotnet/README.md) for full setup instructions including how to build the native library and configure your API key.

## Releasing

No releases. This is example code.

## License

MIT
