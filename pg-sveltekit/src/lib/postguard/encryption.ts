import { PostGuard } from '@e4a/postguard-js';
import type { CitizenRecipient, OrganisationRecipient } from '$lib/types';
import { PKG_URL, CRYPTIFY_URL } from '$lib/config';

const pg = new PostGuard({ pkgUrl: PKG_URL, cryptifyUrl: CRYPTIFY_URL });

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
	const { files, citizen, organisation, apiKey, message, onProgress, abortController } = options;

	await pg.encryptAndDeliver({
		sign: pg.sign.apiKey(apiKey),
		files,
		recipients: [pg.recipient.email(citizen.email), pg.recipient.emailDomain(organisation.email)],
		onProgress,
		signal: abortController?.signal,
		delivery: {
			message: message ?? undefined,
			language: 'EN',
			confirmToSender: false
		}
	});
}
