<script lang="ts">
	import FileDropzone from '$lib/components/FileDropzone.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { encryptAndSend } from '$lib/postguard/encryption';

	let { data } = $props();

	type SendState = 'idle' | 'encrypting' | 'done' | 'error';

	function createDummyFile(name: string, content: string): File {
		return new File([content], name, { type: 'text/plain', lastModified: Date.now() });
	}

	let files: File[] = $state([
		createDummyFile('report.txt', 'This is a sample report for PostGuard encryption testing.'),
		createDummyFile(
			'notes.txt',
			'These are confidential notes.\nOnly the intended recipient should be able to read this.'
		)
	]);
	let citizenEmail = $state('');
	let citizenName = $state('');
	let orgEmail = $state('');
	let orgName = $state('');
	let apiKey = $state(data.apiKey);
	let message = $state('');
	let sendState: SendState = $state('idle');
	let progress = $state(0);
	let errorMessage = $state('');
	let abortController: AbortController | undefined = $state();
	let uuid = $state('');

	const canSend = $derived(
		files.length > 0 && citizenEmail.includes('@') && orgEmail.includes('@') && apiKey.length > 0
	);

	async function handleSend() {
		if (!canSend) return;

		sendState = 'encrypting';
		progress = 0;
		errorMessage = '';
		abortController = new AbortController();

		try {
			uuid = await encryptAndSend({
				files,
				citizen: { email: citizenEmail, name: citizenName },
				organisation: { email: orgEmail, name: orgName },
				apiKey,
				message: message || null,
				onProgress: (pct) => (progress = pct),
				abortController
			});
			sendState = 'done';
		} catch (e) {
			if (abortController.signal.aborted) {
				sendState = 'idle';
				progress = 0;
			} else {
				sendState = 'error';
				errorMessage = e instanceof Error ? e.message : String(e);
				console.error('Encryption error:', e);
			}
		}
	}

	function handleCancel() {
		abortController?.abort();
		sendState = 'idle';
		progress = 0;
	}

	function handleReset() {
		files = [];
		citizenEmail = '';
		citizenName = '';
		orgEmail = '';
		orgName = '';
		apiKey = data.apiKey;
		message = '';
		sendState = 'idle';
		progress = 0;
		errorMessage = '';
		uuid = '';
	}
</script>

<h1>Encrypt & Send</h1>

{#if sendState === 'done'}
	<div class="success-box">
		<p>Files encrypted and sent successfully!</p>
		<p>Recipients will receive an email with the download link.</p>
		<p class="uuid-line">File UUID: <code>{uuid}</code></p>
		<button onclick={handleReset}>Send more files</button>
	</div>
{:else}
	<section>
		<h2>1. Select files</h2>
		<FileDropzone {files} onfileschange={(f) => (files = f)} />
	</section>

	<section>
		<h2>2. Citizen</h2>
		<p class="hint">The citizen must prove their exact email address to decrypt.</p>
		<div class="field-group">
			<input type="text" bind:value={citizenName} placeholder="Name" />
			<input type="email" bind:value={citizenEmail} placeholder="citizen@example.com" />
		</div>
	</section>

	<section>
		<h2>3. Organisation</h2>
		<p class="hint">
			The organisation can decrypt by proving an email at the domain
			{#if orgEmail.includes('@')}
				<strong>{orgEmail.split('@')[1]}</strong>
			{/if}.
		</p>
		<div class="field-group">
			<input type="text" bind:value={orgName} placeholder="Organisation name" />
			<input type="email" bind:value={orgEmail} placeholder="info@organisation.nl" />
		</div>
	</section>

	<section>
		<h2>4. API token</h2>
		<p class="hint">The PostGuard API key used for sender authentication.</p>
		<input type="text" bind:value={apiKey} placeholder="PG-API-1a2b3c4d5e6f7g8h" />
	</section>

	<section>
		<h2>5. Message (optional)</h2>
		<textarea bind:value={message} placeholder="Add a message for the recipients..." rows="3"
		></textarea>
	</section>

	{#if sendState === 'error'}
		<div class="error-box">
			<p>Error: {errorMessage}</p>
		</div>
	{/if}

	{#if sendState === 'encrypting'}
		<section>
			<ProgressBar percentage={progress} label="Encrypting & uploading..." />
			<button class="cancel-btn" onclick={handleCancel}>Cancel</button>
		</section>
	{:else}
		<button class="send-btn" disabled={!canSend} onclick={handleSend}> Encrypt & Send </button>
	{/if}
{/if}

<style>
	h1 {
		margin-bottom: 0.5rem;
	}
	h2 {
		font-size: 1rem;
		margin-bottom: 0.25rem;
		color: #555;
	}
	section {
		margin-bottom: 1.5rem;
	}
	.hint {
		font-size: 0.85rem;
		color: #888;
		margin: 0 0 0.5rem;
	}
	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.field-group input,
	section > input {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.9rem;
		width: 100%;
		box-sizing: border-box;
	}
	textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-family: inherit;
		font-size: 0.9rem;
		resize: vertical;
		box-sizing: border-box;
	}
	.send-btn {
		background: #2563eb;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
	}
	.send-btn:disabled {
		background: #93b4f5;
		cursor: not-allowed;
	}
	.send-btn:not(:disabled):hover {
		background: #1d4ed8;
	}
	.cancel-btn {
		margin-top: 0.5rem;
		background: none;
		border: 1px solid #ccc;
		padding: 0.4rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		color: #666;
	}
	.success-box {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 8px;
		padding: 1.5rem;
	}
	.success-box p {
		margin: 0 0 0.5rem;
	}
	.success-box button {
		background: #2563eb;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		margin-top: 0.5rem;
	}
	.error-box {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
	}
	.error-box p {
		margin: 0;
		color: #dc2626;
	}
</style>
