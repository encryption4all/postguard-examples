<h1>PostGuard for Business</h1>

<p>
	This example app demonstrates <strong>PostGuard for Business</strong> &mdash; an Identity-Based Encryption
	system for secure file sharing using API key authentication.
</p>

<h2>How it works</h2>

<h3>Sending files</h3>
<ol>
	<li>Go to <a href="/send">Send</a></li>
	<li>Select files to encrypt</li>
	<li>Add one or more recipients (email + optional attributes)</li>
	<li>Click "Encrypt & Send" &mdash; the API key authenticates the sender automatically</li>
	<li>PostGuard/Cryptify delivers the encrypted file via email</li>
</ol>

<h3>Receiving files</h3>
<ol>
	<li>Open the download link from the email (or go to <a href="/download">Download</a>)</li>
	<li>Authenticate with Yivi to prove your identity</li>
	<li>The file is decrypted and downloaded automatically</li>
</ol>

<h2>Architecture</h2>
<p>
	The SvelteKit server proxies all requests to PKG and Cryptify, injecting the API key server-side.
	This keeps the API key secure and avoids CORS issues.
</p>

<style>
	h1 {
		margin-bottom: 0.5rem;
	}
	h2 {
		margin-top: 1.5rem;
		font-size: 1.2rem;
	}
	h3 {
		margin-top: 1rem;
		font-size: 1rem;
	}
	p,
	li {
		line-height: 1.6;
		color: #555;
	}
	a {
		color: #2563eb;
	}
</style>
