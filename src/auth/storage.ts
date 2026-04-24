import type { B24OAuthParams } from '@bitrix24/b24jssdk'
import { config } from '../config'

export type StoredTokens = B24OAuthParams

export async function loadTokens(): Promise<StoredTokens | null> {
	const file = Bun.file(config.tokenFile)
	if (!(await file.exists())) return null
	return file.json()
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
	await Bun.write(config.tokenFile, JSON.stringify(tokens, null, 2))
}
