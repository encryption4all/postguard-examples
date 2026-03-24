import type { ISealOptions } from '@e4a/pg-wasm';
import type { CitizenRecipient, OrganisationRecipient } from '$lib/types';
import { PKG_URL, UPLOAD_CHUNK_SIZE } from '$lib/config';
import Chunker, { withTransform } from './chunker';
import { createFileReadable, getFileStoreStream } from './file-provider';

// Fetch the master public key from PKG
async function fetchMPK(): Promise<unknown> {
	const response = await fetch(`${PKG_URL}/v2/parameters`);
	if (!response.ok) throw new Error(`Failed to fetch PKG parameters: ${response.status}`);
	const json = await response.json();
	return json.publicKey;
}

// Fetch signing keys using API key auth (no Yivi needed)
async function fetchSigningKeys(
	apiKey: string
): Promise<{ pubSignKey: unknown; privSignKey?: unknown }> {
	const response = await fetch(`${PKG_URL}/v2/irma/sign/key`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			pubSignId: [{ t: 'pbdf.sidn-pbdf.email.email' }]
		})
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Failed to fetch signing keys: ${response.status} ${text}`);
	}
	return response.json();
}

function extractDomain(email: string): string {
	return email.split('@')[1] || '';
}

export interface EncryptAndSendOptions {
	files: File[];
	citizen: CitizenRecipient;
	organisation: OrganisationRecipient;
	apiKey: string;
	message: string | null;
	onProgress?: (percentage: number) => void;
	abortController?: AbortController;
}

export async function encryptAndSend(options: EncryptAndSendOptions): Promise<void> {
	const {
		files,
		citizen,
		organisation,
		apiKey,
		message,
		onProgress,
		abortController = new AbortController()
	} = options;

	// Fetch MPK and signing keys in parallel
	const [mpk, signingKeys] = await Promise.all([fetchMPK(), fetchSigningKeys(apiKey)]);

	// Build encryption policy
	const ts = Math.round(Date.now() / 1000);
	const policy: Record<string, { ts: number; con: { t: string; v?: string }[] }> = {};

	// Citizen: must prove exact email address
	policy[citizen.email] = {
		ts,
		con: [{ t: 'pbdf.sidn-pbdf.email.email', v: citizen.email }]
	};

	// Organisation: must prove an email at the correct domain
	policy[organisation.email] = {
		ts,
		con: [{ t: 'pbdf.sidn-pbdf.email.domain', v: extractDomain(organisation.email) }]
	};

	const sealOptions: ISealOptions = {
		policy,
		pubSignKey: signingKeys.pubSignKey as ISealOptions['pubSignKey']
	};
	if (signingKeys.privSignKey) {
		sealOptions.privSignKey = signingKeys.privSignKey as ISealOptions['pubSignKey'];
	}

	// Import pg-wasm and Conflux dynamically (client-side only, WASM)
	const { sealStream } = await import('@e4a/pg-wasm');
	const { Writer: ConfluxWriter } = await import('@transcend-io/conflux');

	// Create ZIP stream from files
	const zipTransform = new ConfluxWriter();
	const readable = zipTransform.readable as ReadableStream;
	const writable = zipTransform.writable;
	const writer = writable.getWriter();

	for (const f of files) {
		const s = createFileReadable(f);
		writer.write({ name: f.name, lastModified: f.lastModified, stream: () => s });
	}
	writer.close();

	// Set up upload stream with chunking
	const uploadChunker = new Chunker(UPLOAD_CHUNK_SIZE);
	const recipientEmails = [citizen.email, organisation.email].join(', ');
	const totalSize = files.reduce((a, f) => a + f.size, 0);

	const fileStream = getFileStoreStream(
		abortController,
		recipientEmails,
		message,
		(uploaded, last) => {
			if (onProgress) {
				const pct = totalSize > 0 ? Math.min(100, Math.round((uploaded / totalSize) * 100)) : 0;
				onProgress(last ? 100 : pct);
			}
		}
	);

	// Encrypt: ZIP → sealStream → chunker → upload
	await sealStream(
		mpk,
		sealOptions,
		readable,
		withTransform(fileStream, uploadChunker, abortController.signal)
	);
}
