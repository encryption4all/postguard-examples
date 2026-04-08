import { PG_API_KEY } from '$lib/config.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		apiKey: PG_API_KEY
	};
};
