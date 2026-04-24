import { createB24Client } from '../auth/client'
import { config } from '../config'

export async function activateConnector(
	lineId: string,
	active = true,
): Promise<void> {
	const b24 = await createB24Client()

	const result = await b24.callMethod('imconnector.activate', {
		CONNECTOR: config.connector.id,
		LINE: lineId,
		ACTIVE: active ? 'Y' : 'N',
	})

	console.log(
		`[connector] line ${lineId} ${active ? 'activated' : 'deactivated'}:`,
		result.getData(),
	)
}
