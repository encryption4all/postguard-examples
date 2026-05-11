import { env } from '$env/dynamic/private';

export const PG_API_KEY = env['PG_API_KEY'] ?? '';
