import { type ICreateRoomOpts } from 'matrix-js-sdk'
import { createAsClient, matrixUserId } from './client'
import { matrixConfig } from './config'
import { registerUser } from './users'
import { clientRooms } from '../socket/state'

export async function createRoom(creatorLocalpart: string, name: string): Promise<string> {
	const client = createAsClient(matrixUserId(creatorLocalpart))
	const { room_id } = await client.createRoom({
		preset: 'private_chat' as ICreateRoomOpts['preset'],
		name,
		is_direct: false,
	})
	return room_id
}

export async function ensureRoom(clientId: string): Promise<string> {
	const existing = clientRooms.get(clientId)
	if (existing) return existing

	await registerUser(clientId)
	const roomId = await createRoom(clientId, `Chat ${clientId}`)
	clientRooms.set(clientId, roomId)
	return roomId
}

export async function inviteUser(roomId: string, userId: string, inviterLocalpart: string): Promise<void> {
	const client = createAsClient(matrixUserId(inviterLocalpart))
	try {
		await client.invite(roomId, userId)
	} catch (err: any) {
		// Ignore if already in room or already invited
		if (err?.data?.errcode === 'M_FORBIDDEN' && err?.data?.error?.includes('already')) return
		throw err
	}
}

export async function joinRoom(roomId: string, userLocalpart: string): Promise<void> {
	const client = createAsClient(matrixUserId(userLocalpart))
	await client.joinRoom(roomId)
}

type AdminRoomsResponse = {
	rooms: Array<{ room_id: string; name?: string }>
	next_token?: string
}

export async function loadClientRooms(): Promise<void> {
	if (!matrixConfig.adminToken) {
		console.warn('[matrix] MATRIX_ADMIN_TOKEN not set — skipping room preload')
		return
	}

	let url: string | null = `${matrixConfig.homeserver}/_synapse/admin/v1/rooms?limit=100`
	let loaded = 0

	while (url) {
		const res = await fetch(url, { headers: { Authorization: `Bearer ${matrixConfig.adminToken}` } })
		if (!res.ok) {
			console.error('[matrix] failed to load rooms from admin API:', res.status)
			return
		}
		const data = (await res.json()) as AdminRoomsResponse
		for (const room of data.rooms) {
			if (room.name?.startsWith('Chat ')) {
				const clientId = room.name.slice(5)
				clientRooms.set(clientId, room.room_id)
				loaded++
			}
		}
		url = data.next_token
			? `${matrixConfig.homeserver}/_synapse/admin/v1/rooms?limit=100&from=${data.next_token}`
			: null
	}

	console.log(`[matrix] loaded ${loaded} client rooms from Synapse`)
}
