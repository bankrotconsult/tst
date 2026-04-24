import { createB24Client } from '../auth/client'
import { config } from '../config'

export async function registerConnector(): Promise<void> {
	const b24 = await createB24Client()

	const result = await b24.callMethod('imconnector.register', {
		ID: config.connector.id,
		NAME: config.connector.name,
		ICON_COLOR: config.connector.color,
		SEND: config.connector.webhookUrl,
		EVENT_MESSAGE_ADD: config.connector.webhookUrl,
		EVENT_WELCOME_USER: config.connector.webhookUrl,
		EVENT_BOT_DELETE: config.connector.webhookUrl,
	})

	console.log('[connector] registered:', result.getData())
}
