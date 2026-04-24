import { registerUser, } from '../../matrix/users'
import { inviteUser, joinRoom } from '../../matrix/rooms'
import { getHistory, sendMessage } from '../../matrix/messages'
import { matrixUserId } from '../../matrix/client'
import { clientRooms, wsAdmins, adminWatching } from '../state'
import type { WsData } from '../types'
import type { ServerWebSocket } from 'bun'

type AdminWs = ServerWebSocket<WsData>

function conversationsPayload() {
	return {
		type: 'conversations',
		data: Array.from(clientRooms.entries()).map(([clientId, roomId]) => ({ clientId, roomId })),
	}
}

export function onAdminOpen(ws: AdminWs): void {
	const { userId } = ws.data
	wsAdmins.set(userId, ws)
	console.log(`[ws/admin] connected: ${userId}`)
	ws.send(JSON.stringify(conversationsPayload()))
}

export async function onAdminMessage(ws: AdminWs, raw: string): Promise<void> {
	const data = JSON.parse(raw)
	const { userId } = ws.data

	if (data.type === 'join') {
		const clientId: string = data.client_id ?? ''
		const roomId = clientRooms.get(clientId)
		if (!roomId) {
			ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }))
			return
		}
		adminWatching.set(userId, clientId)

		await registerUser(userId)
		await inviteUser(roomId, matrixUserId(userId), clientId)
		await joinRoom(roomId, userId)

		const history = await getHistory(roomId, clientId)
		ws.send(JSON.stringify({ type: 'history', messages: history }))
		return
	}

	if (data.type === 'message') {
		const clientId: string = data.client_id ?? adminWatching.get(userId) ?? ''
		const text = (data.text ?? '').trim()
		const roomId = clientRooms.get(clientId)
		if (!roomId) {
			ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }))
			return
		}
		if (text) await sendMessage(roomId, text, userId)
	}
}

export function onAdminClose(ws: AdminWs): void {
	wsAdmins.delete(ws.data.userId)
	adminWatching.delete(ws.data.userId)
	console.log(`[ws/admin] disconnected: ${ws.data.userId}`)
}
