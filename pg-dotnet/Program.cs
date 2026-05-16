using E4A.PostGuard;
using E4A.PostGuard.Models;

var pkgUrl = Environment.GetEnvironmentVariable("PG_PKG_URL")
    ?? "https://pkg.staging.postguard.eu";
var cryptifyUrl = Environment.GetEnvironmentVariable("PG_CRYPTIFY_URL")
    ?? "https://storage.staging.postguard.eu";
var apiKey = Environment.GetEnvironmentVariable("PG_API_KEY")
    ?? throw new Exception("Set PG_API_KEY environment variable");

var pg = new PostGuard(new PostGuardConfig
{
    PkgUrl = pkgUrl,
    CryptifyUrl = cryptifyUrl
});

// Create sample files
var files = new List<PgFile>
{
    new("report.txt", new MemoryStream("This is a sample report for PostGuard encryption testing."u8.ToArray())),
    new("notes.txt", new MemoryStream("These are confidential notes.\nOnly the intended recipient should be able to read this."u8.ToArray()))
};

// ── Flow 1: Silent upload (returns UUID for custom distribution) ──

Console.WriteLine("=== Flow 1: Encrypt and Upload ===");
Console.WriteLine("Encrypting and uploading silently...");

var sealed1 = pg.Encrypt(new EncryptInput
{
    Files = files,
    Recipients =
    [
        pg.Recipient.Email("citizen@example.com"),
        pg.Recipient.EmailDomain("info@org.nl")
    ],
    Sign = pg.Sign.ApiKey(apiKey)
});

// No UploadOptions → no Cryptify-sent emails. The caller distributes the
// download link (or the recipients use the PostGuard browser/Outlook/
// Thunderbird add-ons to decrypt directly).
var result1 = await sealed1.UploadAsync();
Console.WriteLine($"Upload complete! UUID: {result1.Uuid}");
Console.WriteLine($"Download URL: https://postguard.eu/download?uuid={result1.Uuid}");
Console.WriteLine();

// ── Flow 2: Upload with Cryptify-sent recipient emails ──

Console.WriteLine("=== Flow 2: Encrypt and Deliver ===");
Console.WriteLine("Encrypting and delivering via Cryptify email...");

// Reset streams for reuse
foreach (var f in files) f.Content.Position = 0;

var sealed2 = pg.Encrypt(new EncryptInput
{
    Files = files,
    Recipients =
    [
        pg.Recipient.Email("bob@example.com")
    ],
    Sign = pg.Sign.ApiKey(apiKey)
});

var result2 = await sealed2.UploadAsync(new UploadOptions
{
    Notify = new NotifyOptions
    {
        // Both opt-in: Cryptify emails the recipient with a download link
        // and the sender with a confirmation receipt.
        Recipients = true,
        Sender = true,
        Message = "Your documents are attached. Please use PostGuard to decrypt.",
        Language = "EN"
    }
});
Console.WriteLine($"Delivered! UUID: {result2.Uuid}");
Console.WriteLine("Recipients will receive an email from noreply@postguard.eu");
