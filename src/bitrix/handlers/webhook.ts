import { createB24Client } from '../auth/client'
import { config } from '../../config'
import { activateConnector } from '../connector/activate'
import { setLineId, lineId, wsClients, wsAdmins, adminWatching } from '../../socket/state'

type BitrixEvent = {
	event?: string
	PLACEMENT?: string
	PLACEMENT_OPTIONS?: Record<string, string>
	data?: Record<string, any>
	auth?: Record<string, string>
}

async function parseBody(req: Request): Promise<BitrixEvent> {
	const contentType = req.headers.get('content-type') ?? ''
	if (contentType.includes('application/json')) return req.json() as Promise<BitrixEvent>
	const text = await req.text()
	return Object.fromEntries(new URLSearchParams(text)) as unknown as BitrixEvent
}

async function handleSettingConnector(options: Record<string, string>): Promise<void> {
	const line = options['LINE']
	const active = options['ACTIVE_STATUS'] === '1'

	if (!line) {
		console.warn('[webhook] SETTING_CONNECTOR: missing LINE in options')
		return
	}

	setLineId(line)
	await activateConnector(line, active)
	console.log(`[webhook] connector ${active ? 'activated' : 'deactivated'} for line ${line}`)
}

async function handleMessageAdd(data: Record<string, any>): Promise<void> {
	const messages: any[] = data?.MESSAGES ?? []
	if (!messages.length) return

	const currentLineId = lineId
	if (!currentLineId) {
		console.warn('[webhook] ONIMCONNECTORMESSAGEADD: lineId not set, skipping delivery status')
		return
	}

	const b24 = await createB24Client()

	for (const msg of messages) {
		console.log('[webhook] message from Bitrix operator:', msg)

		const clientId = msg.connector?.user_id as string | undefined
		const text = (msg.message?.text ?? '') as string

		if (clientId && text) {
			const payload = JSON.stringify({ text, sender: 'operator', createdAt: Date.now() })
			wsClients.get(clientId)?.send(payload)
			for (const [adminId, watchedId] of adminWatching) {
				if (watchedId === clientId) wsAdmins.get(adminId)?.send(payload)
			}
		}

		try {
			await b24.actions.v2.call.make({
				method: 'imconnector.send.status.delivery',
				params: {
					CONNECTOR: config.connector.id,
					LINE: currentLineId,
					MESSAGES: [
						{
							im: msg.im,
							message: { id: [1] },
							chat: { id: msg.chat?.id },
						},
					],
				},
			})
		} catch (err) {
			console.error('[webhook] delivery status error:', err)
		}
	}
}

export async function handleWebhook(req: Request): Promise<Response> {
	const body = await parseBody(req)

	console.log('[webhook] incoming:', body.event ?? body.PLACEMENT, body.data ?? body.PLACEMENT_OPTIONS)

	if (body.PLACEMENT === 'SETTING_CONNECTOR') {
		await handleSettingConnector(body.PLACEMENT_OPTIONS ?? {})
		return Response.json({ status: 'ok' })
	}

	switch (body.event) {
		case 'ONIMCONNECTORMESSAGEADD':
			await handleMessageAdd(body.data ?? {})
			break
		case 'ONIMCONNECTORLINEDELETE':
			console.log('[webhook] line deleted')
			break
	}

	return Response.json({ status: 'ok' })
}
