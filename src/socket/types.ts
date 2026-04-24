export type WsData = {
	authenticated: boolean
	userId: string
	role: 'client' | 'admin' | ''
}
