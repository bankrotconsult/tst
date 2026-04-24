import { B24OAuth } from '@bitrix24/b24jssdk'
import { config } from '../config'
import { loadTokens, saveTokens } from './storage'

export async function createB24Client(): Promise<B24OAuth> {
	const tokens = await loadTokens()
	if (!tokens)
		throw new Error('Tokens not found. Install the app on Bitrix24 first.')

	const client = new B24OAuth(tokens, {
		clientId: config.bitrix.clientId,
		clientSecret: config.bitrix.clientSecret,
	})

	client.setCallbackRefreshAuth(async ({ b24OAuthParams }) => {
		await saveTokens(b24OAuthParams)
	})

	return client
}
