import { config } from './config'
import { handleInstall } from './bitrix/handlers/install'
import { handleWebhook } from './bitrix/handlers/webhook'
import { handleSetupRegister } from './bitrix/handlers/setup'
import { handleSessionRegister } from './backend/handlers/session'
import { handleTransaction, handleAsUser, handleAsRoom } from './matrix/handlers/appservice'
import { logRequest } from './middleware/logger'
import { websocketHandlers, type WsData } from './socket/index'
import { loadClientRooms } from './matrix/rooms'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': '*',
}

type Handler = (req: Request) => Promise<Response> | Response

function withMiddleware(handler: Handler): Handler {
	return async (req) => {
		if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
		await logRequest(req)
		try {
			const res = await handler(req)
			if (!res.ok) console.warn(`[http] ${req.method} ${new URL(req.url).pathname} → ${res.status}`)
			const headers = new Headers(res.headers)
			for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v)
			return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
		} catch (err) {
			console.error(`[http] unhandled error in ${req.method} ${new URL(req.url).pathname}:`, err)
			return Response.json({ error: 'internal server error' }, { status: 500, headers: CORS_HEADERS })
		}
	}
}

export async function startServer(): Promise<void> {
	await loadClientRooms()
	await handleSetupRegister()

	Bun.serve({
		port: config.port,
		routes: {
			// Bitrix24
			'/dialog/install': { POST: withMiddleware(handleInstall) },
			'/dialog/bitrix/handler/': { POST: withMiddleware(handleWebhook) },

			// Matrix Application Service
			'/dialog/_matrix/app/v1/transactions/:txnId': { PUT: withMiddleware(handleTransaction) },
			'/dialog/_matrix/app/v1/users/:userId': { GET: withMiddleware(handleAsUser) },
			'/dialog/_matrix/app/v1/rooms/:roomAlias': { GET: withMiddleware(handleAsRoom) },

			// Backend internal
			'/dialog/session/register/': { POST: withMiddleware(handleSessionRegister) },
		},
		websocket: websocketHandlers,
		async fetch(req, server) {
			const { pathname } = new URL(req.url)

			if (pathname === '/ws/chat') {
				const upgraded = server.upgrade(req, {
					data: { authenticated: false, userId: '', role: '' } satisfies WsData,
				})
				if (upgraded) return
			}

			await logRequest(req)
			return new Response('Not Found', { status: 404, headers: CORS_HEADERS })
		},
	})

	console.log(`[server] listening on port ${config.port}`)
}
