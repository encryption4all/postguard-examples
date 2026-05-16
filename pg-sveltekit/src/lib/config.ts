import { env } from '$env/dynamic/public';

export const APP_NAME = env.PUBLIC_APP_NAME || 'PostGuard for Business Example';
export const PKG_URL = env.PUBLIC_PKG_URL || 'https://pkg.staging.postguard.eu';
export const CRYPTIFY_URL = env.PUBLIC_CRYPTIFY_URL || 'https://storage.staging.postguard.eu';

export const UPLOAD_CHUNK_SIZE = 1024 * 1024; // 1MB
export const FILEREAD_CHUNK_SIZE = 1024 * 1024; // 1MB
