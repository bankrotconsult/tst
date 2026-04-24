import type { ServerWebSocket } from 'bun'
import { sessions } from './state'
import { onClientOpen, onClientMessage, onClientClose } from './handlers/client'
import { onAdminOpen, onAdminMessage, onAdminClose } from './handlers/admin'
import type { WsData } from './types'

export type { WsData }

export const websocketHandlers = {
	async open(ws: ServerWebSocket<WsData>) {
		if (!ws.data.authenticated) return
		if (ws.data.role === 'client') await onClientOpen(ws)
		else await onAdminOpen(ws)
	},

	async message(ws: ServerWebSocket<WsData>, raw: string | Buffer) {
		const text = typeof raw === 'string' ? raw : raw.toString()

		if (!ws.data.authenticated) {
			await handleAuth(ws, text)
			return
		}

		try {
			if (ws.data.role === 'client') await onClientMessage(ws, text)
			else await onAdminMessage(ws, text)
		} catch (err) {
			console.error(`[ws] message error (${ws.data.userId}):`, err)
		}
	},

	close(ws: ServerWebSocket<WsData>) {
		if (!ws.data.authenticated) return
		if (ws.data.role === 'client') onClientClose(ws)
		else onAdminClose(ws)
	},
}

async function handleAuth(ws: ServerWebSocket<WsData>, raw: string): Promise<void> {
	let token: string
	try {
		token = JSON.parse(raw)?.token ?? ''
	} catch {
		ws.close(4001, 'Invalid JSON')
		return
	}

	const session = sessions.get(token)
	if (!session || session.expiresAt < Date.now() / 1000) {
		ws.close(4001, 'Invalid or expired token')
		return
	}

	ws.data.authenticated = true
	ws.data.userId = session.userId
	ws.data.role = session.role

	if (session.role === 'client') await onClientOpen(ws)
	else onAdminOpen(ws)
}
