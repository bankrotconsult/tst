import { Direction, MsgType, type IRoomEvent } from 'matrix-js-sdk'
import { createAsClient, matrixUserId } from './client'

export type MatrixMessage = {
	id: string
	text: string
	sender: string
	createdAt: number
}

export async function getHistory(roomId: string, asLocalpart: string, limit = 20): Promise<MatrixMessage[]> {
	const client = createAsClient(matrixUserId(asLocalpart))
	const response = await client.createMessagesRequest(roomId, null, limit, Direction.Backward)

	return (response.chunk as IRoomEvent[])
		.filter((e) => e.type === 'm.room.message' && e.content?.msgtype === 'm.text')
		.map((e) => ({
			id: e.event_id,
			text: (e.content?.body as string) ?? '',
			sender: e.sender,
			createdAt: e.origin_server_ts,
		}))
		.reverse()
}

export async function sendMessage(roomId: string, text: string, asLocalpart: string): Promise<void> {
	const client = createAsClient(matrixUserId(asLocalpart))
	await client.sendMessage(roomId, { msgtype: MsgType.Text, body: text })
}
