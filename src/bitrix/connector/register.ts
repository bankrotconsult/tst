import { createB24Client } from '../auth/client'
import { config } from '../../config'

export async function registerConnector(): Promise<void> {
	const b24 = await createB24Client()

	const result = await b24.actions.v2.call.make({
		method: 'imconnector.register',
		params: {
			ID: config.connector.id,
			NAME: config.connector.name,
			ICON_COLOR: config.connector.color,
			PLACEMENT_HANDLER: config.connector.webhookUrl,
			SEND: config.connector.webhookUrl,
			EVENT_MESSAGE_ADD: config.connector.webhookUrl,
			EVENT_WELCOME_USER: config.connector.webhookUrl,
			EVENT_BOT_DELETE: config.connector.webhookUrl,
		},
	})
	console.log('[connector] registered:', result.getData())

	await b24.actions.v2.call.make({
		method: 'event.bind',
		params: {
			event: 'OnImConnectorMessageAdd',
			handler: config.connector.webhookUrl,
		},
	})
	console.log('[connector] event.bind registered')
}
