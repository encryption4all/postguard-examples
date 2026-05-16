import { env } from '$env/dynamic/public';

export const APP_NAME = env.PUBLIC_APP_NAME || 'PostGuard for Business Example';
export const PKG_URL = env.PUBLIC_PKG_URL || 'https://pkg.staging.postguard.eu';
export const CRYPTIFY_URL = env.PUBLIC_CRYPTIFY_URL || 'https://storage.staging.postguard.eu';

// Heuristic: the staging Cryptify (hostname contains "staging") does NOT
// actually deliver notification emails — this keeps real inboxes clean
// while you wire up the SDK. Cryptify exposes no client-visible signal,
// so we infer it from the URL.
function detectStagingCryptify(url: string): boolean {
	try {
		return new URL(url).hostname.toLowerCase().includes('staging');
	} catch {
		return false;
	}
}
export const IS_CRYPTIFY_STAGING = detectStagingCryptify(CRYPTIFY_URL);

export const UPLOAD_CHUNK_SIZE = 1024 * 1024; // 1MB
export const FILEREAD_CHUNK_SIZE = 1024 * 1024; // 1MB
