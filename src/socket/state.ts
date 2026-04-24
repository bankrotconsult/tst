import type { ServerWebSocket } from 'bun'
import type { WsData } from './types'

export type Session = {
	userId: string
	role: 'client' | 'admin'
	expiresAt: number
}

export const sessions = new Map<string, Session>()
export const clientRooms = new Map<string, string>()
export const wsClients = new Map<string, ServerWebSocket<WsData>>()
export const wsAdmins = new Map<string, ServerWebSocket<WsData>>()
export const adminWatching = new Map<string, string>()

export const processedTxns = new Set<string>()

export let lineId: string | null = null
export function setLineId(id: string): void {
	lineId = id
	console.log(`[state] active line id: ${id}`)
}
