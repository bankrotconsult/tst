import { ensureRoom } from '../../matrix/rooms'
import { getHistory, sendMessage } from '../../matrix/messages'
import { clientRooms, wsClients } from '../state'
import type { WsData } from '../types'
import type { ServerWebSocket } from 'bun'

type ClientWs = ServerWebSocket<WsData>

export async function onClientOpen(ws: ClientWs): Promise<void> {
	const { userId } = ws.data
	const roomId = await ensureRoom(userId)
	wsClients.set(userId, ws)
	console.log(`[ws/client] connected: ${userId} room=${roomId}`)

	const history = await getHistory(roomId, userId)
	ws.send(JSON.stringify({ type: 'history', messages: history }))
}

export async function onClientMessage(ws: ClientWs, raw: string): Promise<void> {
	const data = JSON.parse(raw)
	const text = (data.text ?? '').trim()
	if (!text) return

	const roomId = clientRooms.get(ws.data.userId)
	if (!roomId) return

	await sendMessage(roomId, text, ws.data.userId)
}

export function onClientClose(ws: ClientWs): void {
	wsClients.delete(ws.data.userId)
	console.log(`[ws/client] disconnected: ${ws.data.userId}`)
}
