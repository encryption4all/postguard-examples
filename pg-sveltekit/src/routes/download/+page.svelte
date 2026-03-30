<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { PostGuard, DecryptionError, IdentityMismatchError } from '@e4a/postguard-js';
	import type { DecryptResult } from '@e4a/postguard-js';
	import { PKG_URL, CRYPTIFY_URL } from '$lib/config';

	const pg = new PostGuard({ pkgUrl: PKG_URL, cryptifyUrl: CRYPTIFY_URL });

	type DownloadState = 'loading' | 'ready' | 'decrypting' | 'done' | 'error' | 'identity-mismatch';

	let dlState: DownloadState = $state('loading');
	let errorMessage = $state('');

	let uuid = $state('');
	let recipientParam = $state('');
	let manualUuid = $state('');

	let result: DecryptResult | null = $state(null);
	let senderEmail = $state('');

	onMount(() => {
		if (!browser) return;
		const params = new URLSearchParams(window.location.search);
		uuid = params.get('uuid') ?? '';
		recipientParam = params.get('recipient') ?? '';

		if (uuid) {
			startDecrypt();
		} else {
			dlState = 'loading';
		}
	});

	async function startDecrypt() {
		if (!uuid) {
			uuid = manualUuid;
			if (!uuid) return;
		}

		dlState = 'ready';
		await tick();

		try {
			result = await pg.decrypt({
				uuid,
				element: '#yivi-web',
				recipient: recipientParam || undefined
			});

			senderEmail = getSenderEmail(result.sender);
			dlState = 'done';

			// Auto-download
			result.download();
		} catch (e) {
			if (e instanceof IdentityMismatchError) {
				dlState = 'identity-mismatch';
			} else {
				errorMessage = e instanceof Error ? e.message : String(e);
				dlState = 'error';
			}
		}
	}

	function getSenderEmail(identity: any): string {
		if (!identity?.con?.length) return '';
		return identity.con.find((a: any) => a.t?.includes('email') && a.v)?.v ?? '';
	}

	function retry() {
		dlState = 'ready';
		tick().then(() => startDecrypt());
	}
</script>

<h1>Download & Decrypt</h1>

{#if !uuid && dlState === 'loading'}
	<div class="manual-input">
		<p>Enter the file UUID to download:</p>
		<div class="input-row">
			<input type="text" bind:value={manualUuid} placeholder="File UUID" />
			<button onclick={startDecrypt} disabled={!manualUuid}>Download</button>
		</div>
	</div>
{:else if dlState === 'loading'}
	<div class="center">
		<p>Initializing...</p>
	</div>
{:else if dlState === 'ready'}
	<p>Scan the QR code with the Yivi app to authenticate:</p>
	<div id="yivi-web"></div>
{:else if dlState === 'decrypting'}
	<div class="center">
		<p>Decrypting files...</p>
	</div>
{:else if dlState === 'done'}
	<div class="success-box">
		<p>Files decrypted successfully!</p>
		{#if result && result.files.length > 0}
			<p>Files in archive:</p>
			<ul>
				{#each result.files as name (name)}
					<li>{name}</li>
				{/each}
			</ul>
		{/if}
		{#if result}
			<button onclick={() => result?.download()}>Download again</button>
		{/if}
		{#if senderEmail}
			<p class="sender-info">Verified sender: <strong>{senderEmail}</strong></p>
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
	.input-row button {
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
