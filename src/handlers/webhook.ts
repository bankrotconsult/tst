// Incoming events from Bitrix24 open lines connector
// EVENT_MESSAGE_ADD   — operator sent message to user
// EVENT_WELCOME_USER  — new session opened
// EVENT_BOT_DELETE    — user ended session

type BitrixEvent = {
	event: string
	data: Record<string, any>
	auth: Record<string, string>
}

async function parseBody(req: Request): Promise<BitrixEvent> {
	const contentType = req.headers.get('content-type') ?? ''

	if (contentType.includes('application/json')) {
		return req.json() as Promise<BitrixEvent>
	}

	const formData = await req.formData()
	return Object.fromEntries(formData) as unknown as BitrixEvent
}

export async function handleWebhook(req: Request): Promise<Response> {
	const body = await parseBody(req)

	console.log('[webhook] event:', body.event, body.data)

	switch (body.event) {
		case 'ONIMCONNECTORMESSAGEADD':
			// operator → user
			break
		case 'ONIMCONNECTORLINEDELETE':
			// session closed
			break
	}

	return new Response('OK')
}
