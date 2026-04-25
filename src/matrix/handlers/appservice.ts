import { MsgType, type IRoomEvent } from 'matrix-js-sdk'
import { matrixConfig } from '../config'
import { clientRooms, processedTxns, wsAdmins, wsClients, adminWatching, lineId } from '../../socket/state'
import { sendMessage as sendBitrixMessage } from '../../bitrix/connector/message'

function verifyHsToken(req: Request): boolean {
	const auth = req.headers.get('authorization') ?? ''
	const token = auth.replace('Bearer ', '').trim() || new URL(req.url).searchParams.get('access_token') || ''
	return !!matrixConfig.hsToken && token === matrixConfig.hsToken
}

function pushToSocket(ws: { send: (data: string) => void } | undefined, payload: object, label: string): void {
	if (!ws) return
	try {
		ws.send(JSON.stringify(payload))
	} catch (err) {
		console.warn(`[appservice] push error (${label}):`, err)
	}
}

// PUT /dialog/_matrix/app/v1/transactions/:txnId
// Synapse pushes room events here; we forward them to open WebSocket connections.
export async function handleTransaction(req: Request): Promise<Response> {
	if (!verifyHsToken(req)) {
		console.warn(`[appservice] unauthorized request from ${req.headers.get('x-forwarded-for') ?? 'unknown'}`)
		return Response.json({ errcode: 'M_FORBIDDEN' }, { status: 401 })
	}

	const txnId = new URL(req.url).pathname.split('/').at(-1) ?? ''
	if (processedTxns.has(txnId)) return Response.json({})
	processedTxns.add(txnId)

	const body = (await req.json()) as { events: IRoomEvent[] }

	for (const event of body.events) {
		if (event.type !== 'm.room.message') continue
		const content = event.content as { msgtype?: string; body?: string }
		if (content.msgtype !== MsgType.Text) continue

		const roomId = event.room_id
		const text = (content.body ?? '').trim()

		const clientId = [...clientRooms.entries()].find(([, rid]) => rid === roomId)?.[0]
		if (!clientId) continue

		const senderLocalpart = event.sender.slice(1).split(':')[0]
		if (senderLocalpart === clientId && lineId) {
			sendBitrixMessage({ lineId, userId: clientId, userName: clientId, text }).catch((err) =>
				console.error('[appservice] bitrix send failed:', err)
			)
		}

		const payload = {
			id: event.event_id,
			text,
			sender: event.sender,
			createdAt: event.origin_server_ts,
		}

		console.log(`[appservice] event in room ${roomId} from ${event.sender}: ${text}`)

		pushToSocket(wsClients.get(clientId), payload, `client:${clientId}`)

		for (const [adminId, watchedClientId] of adminWatching) {
			if (watchedClientId !== clientId) continue
			pushToSocket(wsAdmins.get(adminId), { ...payload, client_id: clientId }, `admin:${adminId}`)
		}
	}

	return Response.json({})
}

// GET /dialog/_matrix/app/v1/users/:userId
export function handleAsUser(req: Request): Response {
	if (!verifyHsToken(req)) {
		console.warn(`[appservice] unauthorized request from ${req.headers.get('x-forwarded-for') ?? 'unknown'}`)
		return Response.json({ errcode: 'M_FORBIDDEN' }, { status: 401 })
	}
	return Response.json({ errcode: 'M_NOT_FOUND' }, { status: 404 })
}

// GET /dialog/_matrix/app/v1/rooms/:roomAlias
export function handleAsRoom(req: Request): Response {
	if (!verifyHsToken(req)) {
		console.warn(`[appservice] unauthorized request from ${req.headers.get('x-forwarded-for') ?? 'unknown'}`)
		return Response.json({ errcode: 'M_FORBIDDEN' }, { status: 401 })
	}
	return Response.json({ errcode: 'M_NOT_FOUND' }, { status: 404 })
}
