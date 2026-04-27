import { sessions, type Session } from '../../socket/state'
import { verifyInternalSecret } from '../auth'
import { setDisplayName } from '../../matrix/users'

type SessionRequest = {
	token: string
	expires_at: number
	user_id: string
	role: 'client' | 'admin'
	first_name?: string
}

function purgeExpired(): void {
	const now = Date.now() / 1000
	for (const [token, session] of sessions) {
		if (session.expiresAt < now) sessions.delete(token)
	}
}

export async function handleSessionRegister(req: Request): Promise<Response> {
	if (!verifyInternalSecret(req)) {
		console.warn('[session] unauthorized: invalid or missing X-Internal-Secret')
		return Response.json({ detail: 'Unauthorized' }, { status: 401 })
	}

	const body = (await req.json()) as SessionRequest

	purgeExpired()

	const session: Session = {
		userId: body.user_id,
		role: body.role,
		expiresAt: body.expires_at,
	}
	sessions.set(body.token, session)

	if (body.first_name) {
		await setDisplayName(body.user_id, body.first_name).catch((err) =>
			console.warn(`[session] setDisplayName failed for ${body.user_id}:`, err),
		)
	}

	console.log(`[session] registered: ${body.user_id} (${body.role})`)
	return Response.json({ status: 'ok' })
}
