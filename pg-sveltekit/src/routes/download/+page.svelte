<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import {
		createUnsealer,
		sortPolicies,
		secondsTill4AM,
		readZipFilenames
	} from '$lib/postguard/decryption';
	import { PKG_URL } from '$lib/config';

	type DownloadState =
		| 'loading'
		| 'recipients'
		| 'ready'
		| 'decrypting'
		| 'done'
		| 'error'
		| 'identity-mismatch';

	let dlState: DownloadState = $state('loading');
	let errorMessage = $state('');

	let uuid = $state('');
	let recipientParam = $state('');
	let manualUuid = $state('');

	let policies: Map<string, any>;
	let keylist: string[] = $state([]);
	let key = $state('');
	let timestamp: number;
	let keyRequest: any;
	let usk: any;
	let unsealer: any;

	let decryptedBlobUrl = $state('');
	let senderIdentity: any = $state(null);
	let fileList: string[] = $state([]);

	onMount(() => {
		if (!browser) return;
		const params = new URLSearchParams(window.location.search);
		uuid = params.get('uuid') ?? '';
		recipientParam = params.get('recipient') ?? '';

		if (uuid) {
			startDownload();
		} else {
			dlState = 'loading';
		}
	});

	async function startDownload() {
		if (!uuid) {
			uuid = manualUuid;
			if (!uuid) return;
		}
		dlState = 'loading';

		try {
			unsealer = await createUnsealer(uuid);
			policies = unsealer.inspect_header();

			try {
				senderIdentity = unsealer.public_identity();
			} catch {
				// May not be available before unsealing
			}

			checkRecipients();
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : String(e);
			dlState = 'error';
		}
	}

	function checkRecipients() {
		console.log('[checkRecipients] policies:', [...policies.entries()]);
		console.log('[checkRecipients] recipientParam:', recipientParam);
		if (recipientParam && policies.has(recipientParam)) {
			key = recipientParam;
			processPolicy();
			return;
		}

		if (policies.size === 1) {
			key = policies.keys().next().value!;
			processPolicy();
		} else {
			keylist = [...policies.keys()].filter((k) => k);
			dlState = 'recipients';
		}
	}

	function processPolicy() {
		const policy = policies.get(key);
		timestamp = policy.ts;
		const recipientAndCreds = sortPolicies(policy.con);

		const stripped = JSON.parse(JSON.stringify(recipientAndCreds));
		console.log('[processPolicy] raw con:', JSON.stringify(recipientAndCreds));
		for (const c of stripped) {
			if (c.t === 'pbdf.sidn-pbdf.email.email') {
				// Citizen: enforce exact email match
				c.v = key;
			} else if (c.t === 'pbdf.sidn-pbdf.email.domain') {
				// Organisation: if header doesn't have the domain value, derive from email key
				if (!c.v && key.includes('@')) {
					c.v = key.split('@')[1];
				}
			} else {
				delete c.v;
			}
		}
		console.log('[processPolicy] stripped con:', JSON.stringify(stripped));

		keyRequest = {
			con: stripped,
			validity: secondsTill4AM()
		};

		dlState = 'ready';
		tick().then(() => startYiviSession());
	}

	async function startYiviSession() {
		try {
			const { YiviCore } = await import('@privacybydesign/yivi-core');
			const { YiviClient } = await import('@privacybydesign/yivi-client');
			const { YiviWeb } = await import('@privacybydesign/yivi-web');

			const session = {
				url: PKG_URL,
				start: {
					url: (o: any) => `${o.url}/v2/irma/start`,
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(keyRequest)
				},
				result: {
					url: (o: any, { sessionToken }: any) => `${o.url}/v2/irma/jwt/${sessionToken}`,
					parseResponse: (r: Response) => {
						return r
							.text()
							.then((jwt: string) =>
								fetch(`${PKG_URL}/v2/irma/key/${timestamp.toString()}`, {
									headers: { Authorization: `Bearer ${jwt}` }
								})
							)
							.then((r: Response) => r.json())
							.then((json: any) => {
								if (json.status !== 'DONE' || json.proofStatus !== 'VALID')
									throw new Error('Yivi proof not valid');
								return json.key;
							});
					}
				}
			};

			const yivi = new YiviCore({
				debugging: false,
				session,
				element: '#yivi-web',
				minimal: true,
				language: 'en',
				state: {
					serverSentEvents: false,
					polling: {
						endpoint: 'status',
						interval: 500,
						startState: 'INITIALIZED'
					}
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 500));

			yivi.use(YiviWeb);
			yivi.use(YiviClient);

			usk = await yivi.start();
			dlState = 'decrypting';
			await decryptFiles();
		} catch (e) {
			console.error('Yivi/decrypt error:', e);
			errorMessage = e instanceof Error ? e.message : String(e);
			if ((e as any)?.isDecryptionFailure) {
				dlState = 'identity-mismatch';
			} else {
				dlState = 'error';
			}
		}
	}

	async function decryptFiles() {
		const chunks: BlobPart[] = [];
		const writable = new WritableStream({
			write: (chunk) => {
				chunks.push(chunk as BlobPart);
			}
		});

		await unsealer.unseal(key, usk, writable).catch((e: unknown) => {
			throw Object.assign(new Error(String(e)), { isDecryptionFailure: true });
		});

		if (!senderIdentity) {
			senderIdentity = unsealer.public_identity();
		}

		const blob = new Blob(chunks, { type: 'application/zip' });
		decryptedBlobUrl = URL.createObjectURL(blob);
		fileList = await readZipFilenames(blob);

		const a = document.createElement('a');
		a.href = decryptedBlobUrl;
		a.download = 'files.zip';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		dlState = 'done';
	}

	function getSenderEmail(identity: any): string {
		if (!identity?.con?.length) return '';
		return identity.con.find((a: any) => a.t?.includes('email') && a.v)?.v ?? '';
	}

	function retry() {
		dlState = 'ready';
		tick().then(() => startYiviSession());
	}
</script>

<h1>Download & Decrypt</h1>

{#if !uuid && dlState === 'loading'}
	<div class="manual-input">
		<p>Enter the file UUID to download:</p>
		<div class="input-row">
			<input type="text" bind:value={manualUuid} placeholder="File UUID" />
			<button onclick={startDownload} disabled={!manualUuid}>Download</button>
		</div>
	</div>
{:else if dlState === 'loading'}
	<div class="center">
		<p>Downloading encrypted file...</p>
	</div>
{:else if dlState === 'recipients'}
	<p>Select your email to continue:</p>
	<select bind:value={key}>
		<option value="">Choose recipient...</option>
		{#each keylist as k (k)}
			<option value={k}>{k}</option>
		{/each}
	</select>
	<button onclick={processPolicy} disabled={!key}>Continue</button>
{:else if dlState === 'ready'}
	<p>Scan the QR code with the Yivi app to authenticate:</p>
	<div id="yivi-web"></div>

	{#if getSenderEmail(senderIdentity)}
		<p class="sender-info">Sent by: <strong>{getSenderEmail(senderIdentity)}</strong></p>
	{/if}
{:else if dlState === 'decrypting'}
	<div class="center">
		<p>Decrypting files...</p>
	</div>
{:else if dlState === 'done'}
	<div class="success-box">
		<p>Files decrypted successfully!</p>
		{#if fileList.length > 0}
			<p>Files in archive:</p>
			<ul>
				{#each fileList as name (name)}
					<li>{name}</li>
				{/each}
			</ul>
		{/if}
		{#if decryptedBlobUrl}
			<a href={decryptedBlobUrl} download="files.zip">Download again</a>
		{/if}
		{#if getSenderEmail(senderIdentity)}
			<p class="sender-info">
				Verified sender: <strong>{getSenderEmail(senderIdentity)}</strong>
			</p>
		{/if}
	</div>
{:else if dlState === 'identity-mismatch'}
	<div class="error-box">
		<p>Identity mismatch. The Yivi attributes did not match the encryption policy.</p>
		<button onclick={retry}>Try again</button>
	</div>
{:else if dlState === 'error'}
	<div class="error-box">
		<p>Error: {errorMessage}</p>
	</div>
{/if}

<style>
	h1 {
		margin-bottom: 1rem;
	}
	.center {
		text-align: center;
		padding: 2rem 0;
	}
	.manual-input {
		margin-bottom: 1rem;
	}
	.input-row {
		display: flex;
		gap: 0.5rem;
	}
	.input-row input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.9rem;
	}
	.input-row button,
	select + button {
		background: #2563eb;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}
	.input-row button:disabled {
		background: #93b4f5;
		cursor: not-allowed;
	}
	select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}
	.success-box {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 8px;
		padding: 1.5rem;
	}
	.success-box ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}
	.success-box a {
		color: #2563eb;
	}
	.error-box {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 1.5rem;
	}
	.error-box p {
		margin: 0 0 0.5rem;
		color: #dc2626;
	}
	.error-box button {
		background: #2563eb;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}
	.sender-info {
		color: #555;
		font-size: 0.9rem;
		margin-top: 1rem;
	}
	#yivi-web {
		min-height: 200px;
	}
</style>
