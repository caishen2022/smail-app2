import randomName from "@scaleway/random-name";
import { customAlphabet } from "nanoid";

export const MAIL_DOMAIN = "edu.caishenjia.xyz";
const nanoSuffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function generateEmailAddress() {
	return `${randomName()}-${nanoSuffix()}@${MAIL_DOMAIN}`;
}

export function normalizeEmailAddress(value: string) {
	return value.trim().toLowerCase();
}

export function isReusableGeneratedAddress(value: string) {
	const normalized = normalizeEmailAddress(value);
	return normalized.endsWith(`@${MAIL_DOMAIN}`) && normalized.includes("@");
}
