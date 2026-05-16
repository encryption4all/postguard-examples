# pg-dotnet: PostGuard .NET example

Example .NET console app demonstrating how to use the [postguard-dotnet](https://github.com/encryption4all/postguard-dotnet) SDK for the **Informatierijk notificeren** use case.

## What it does

1. **Encrypt & Upload**: encrypts sample files for a citizen (exact email) and an organisation (email domain), uploads to Cryptify, and returns a UUID for custom distribution.
2. **Encrypt & Deliver**: same as above, but also sends an email notification to the recipient via Cryptify.

## Prerequisites

- .NET 10.0+ SDK
- A PostGuard API key

## Run

Store your API key with [user-secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) (recommended for local dev — kept outside the repo):

```bash
dotnet user-secrets set "PG_API_KEY" "PG-your-key-here"
dotnet run
```

Or pass it via environment variable:

```bash
export PG_API_KEY="PG-your-key-here"
dotnet run
```

Override the default URLs with `PG_PKG_URL` / `PG_CRYPTIFY_URL` (via user-secrets or env vars) if needed.

## How it works

```csharp
var pg = new PostGuard(new PostGuardConfig
{
    PkgUrl = "https://pkg.staging.postguard.eu",
    CryptifyUrl = "https://storage.staging.postguard.eu"
});

// Encrypt returns a lazy Sealed builder
var sealed = pg.Encrypt(new EncryptInput
{
    Files = [new PgFile("report.txt", stream)],
    Recipients = [
        pg.Recipient.Email("citizen@example.com"),
        pg.Recipient.EmailDomain("info@org.nl")
    ],
    Sign = pg.Sign.ApiKey(apiKey)
});

// Silent upload (no Cryptify-sent emails). Returns UUID for custom distribution.
var result = await sealed.UploadAsync();

// Or upload + have Cryptify email the recipients (and optionally the sender).
var result = await sealed.UploadAsync(new UploadOptions
{
    Notify = new NotifyOptions
    {
        Recipients = true,
        Sender = true,
        Message = "Your documents",
        Language = "EN"
    }
});
```
