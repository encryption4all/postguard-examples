# pg-dotnet — PostGuard .NET Example

Example .NET console app demonstrating how to use the [postguard-dotnet](https://github.com/encryption4all/postguard-dotnet) SDK for the **Informatierijk notificeren** use case.

## What it does

1. **Encrypt & Upload** — Encrypts sample files for a citizen (exact email) and an organisation (email domain), uploads to Cryptify, and returns a UUID for custom distribution.
2. **Encrypt & Deliver** — Same as above, but also sends an email notification to the recipient via Cryptify.

## Prerequisites

- .NET 10.0+ SDK
- A PostGuard API key

## Run

```bash
export PG_API_KEY="PG-your-key-here"
dotnet run
```

Or override the staging URLs:

```bash
export PG_PKG_URL="https://pkg.postguard.eu"
export PG_CRYPTIFY_URL="https://fileshare.postguard.eu"
dotnet run
```

## How it works

```csharp
var pg = new PostGuard(new PostGuardConfig
{
    PkgUrl = "https://pkg.staging.postguard.eu",
    CryptifyUrl = "https://fileshare.staging.postguard.eu"
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

// Upload only — returns UUID
var result = await sealed.UploadAsync();

// Or upload + send email notification
var result = await sealed.UploadAsync(new UploadOptions
{
    Notify = new NotifyOptions { Message = "Your documents", Language = "EN" }
});
```
