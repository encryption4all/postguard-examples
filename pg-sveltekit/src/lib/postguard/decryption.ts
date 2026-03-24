import { PKG_URL, CRYPTIFY_URL } from '$lib/config';

// Fetch verification key for the StreamUnsealer
async function fetchVerificationKey(): Promise<unknown> {
	const response = await fetch(`${PKG_URL}/v2/sign/parameters`);
	if (!response.ok) throw new Error(`Failed to fetch sign parameters: ${response.status}`);
	const json = await response.json();
	return json.publicKey;
}

// Download encrypted file and create a StreamUnsealer
export async function createUnsealer(uuid: string) {
	const vk = await fetchVerificationKey();

	const response = await fetch(`${CRYPTIFY_URL}/filedownload/${uuid}`);
	if (!response.ok) throw new Error(`Failed to download file: ${response.status}`);
	if (!response.body) throw new Error('Response body is null');

	const { StreamUnsealer } = await import('@e4a/pg-wasm');
	const unsealer = await StreamUnsealer.new(response.body, vk);

	return unsealer;
}

// Sort policy attributes alphabetically by type
export function sortPolicies(con: { t: string; v?: string }[]): { t: string; v?: string }[] {
	return [...con].sort((a, b) => a.t.localeCompare(b.t));
}

// Calculate seconds until 4 AM (PKG key validity period)
export function secondsTill4AM(): number {
	const now = new Date();
	const target = new Date(now);
	target.setHours(4, 0, 0, 0);
	if (target <= now) target.setDate(target.getDate() + 1);
	return Math.round((target.getTime() - now.getTime()) / 1000);
}

// Read filenames from a ZIP file's central directory (no decompression needed)
export async function readZipFilenames(blob: Blob): Promise<string[]> {
	const buf = await blob.arrayBuffer();
	const view = new DataView(buf);
	const bytes = new Uint8Array(buf);

	// Find End of Central Directory signature (PK\x05\x06)
	let eocdOffset = -1;
	for (let i = bytes.length - 22; i >= 0; i--) {
		if (view.getUint32(i, true) === 0x06054b50) {
			eocdOffset = i;
			break;
		}
	}
	if (eocdOffset === -1) return [];

	const cdOffset = view.getUint32(eocdOffset + 16, true);
	const numEntries = view.getUint16(eocdOffset + 10, true);
	const decoder = new TextDecoder('utf-8');
	const filenames: string[] = [];
	let pos = cdOffset;

	for (let i = 0; i < numEntries; i++) {
		if (view.getUint32(pos, true) !== 0x02014b50) break;
		const filenameLen = view.getUint16(pos + 28, true);
		const extraLen = view.getUint16(pos + 30, true);
		const commentLen = view.getUint16(pos + 32, true);
		const filename = decoder.decode(bytes.slice(pos + 46, pos + 46 + filenameLen));
		if (!filename.endsWith('/')) filenames.push(filename);
		pos += 46 + filenameLen + extraLen + commentLen;
	}
	return filenames;
}
