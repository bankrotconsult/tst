import type { B24OAuthParams } from '@bitrix24/b24jssdk'
import { saveTokens } from '../auth/storage'

// Bitrix24 sends install event as application/x-www-form-urlencoded
// with nested fields: auth[access_token], auth[refresh_token], etc.
export async function handleInstall(req: Request): Promise<Response> {
	const formData = await req.formData()

	const get = (key: string) => (formData.get(key) as string | null) ?? ''

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

	return new Response('OK')
}
