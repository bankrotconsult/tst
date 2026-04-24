import { createB24Client } from '../auth/client'
import { config } from '../../config'

export interface OutgoingMessage {
	lineId: string
	userId: string
	userName: string
	text: string
}

export async function sendMessage(msg: OutgoingMessage): Promise<void> {
	const b24 = await createB24Client()

	await b24.actions.v2.call.make({
		method: 'imconnector.send.message',
		params: {
			CONNECTOR: config.connector.id,
			LINE: msg.lineId,
			MESSAGES: [
				{
					user: { id: msg.userId, name: msg.userName },
					message: { id: String(Date.now()), text: msg.text },
				},
			],
		},
	})
}
