import type { B24OAuthParams } from '@bitrix24/b24jssdk'
import { saveTokens } from '../auth/storage'

// Bitrix24 sends install event as application/x-www-form-urlencoded
// with nested fields: auth[access_token], auth[refresh_token], etc.
export async function handleInstall(req: Request): Promise<Response> {
	try {
		const params = new URLSearchParams(await req.text())
		const get = (key: string) => params.get(key) ?? ''

		const tokens: B24OAuthParams = {
			accessToken: get('auth[access_token]'),
			refreshToken: get('auth[refresh_token]'),
			expires: parseInt(get('auth[expires]')),
			expiresIn: parseInt(get('auth[expires_in]')),
			scope: get('auth[scope]'),
			domain: get('auth[domain]'),
			clientEndpoint: get('auth[client_endpoint]'),
			serverEndpoint: get('auth[server_endpoint]'),
			memberId: get('auth[member_id]'),
			userId: parseInt(get('auth[user_id]')),
			applicationToken: get('auth[application_token]'),
			status: get('auth[status]') as B24OAuthParams['status'],
		}

		await saveTokens(tokens)
		console.log('[install] tokens saved for domain:', tokens.domain)
	} catch (err) {
		console.error('[install] failed to save tokens:', err)
	}

	return new Response('OK')
}
