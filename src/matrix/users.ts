import { createHmac } from 'node:crypto'
import { matrixConfig } from './config'

function derivePassword(username: string): string {
	return createHmac('sha256', matrixConfig.sharedSecret).update(username).digest('hex')
}

function makeMac(nonce: string, username: string, password: string, admin: boolean): string {
	const mac = createHmac('sha1', matrixConfig.sharedSecret)
	mac.update(`${nonce}\x00${username}\x00${password}\x00${admin ? 'admin' : 'notadmin'}`)
	return mac.digest('hex')
}

export async function registerUser(username: string, admin = false): Promise<void> {
	const url = `${matrixConfig.homeserver}/_synapse/admin/v1/register`

	const nonceRes = await fetch(url)
	const { nonce } = (await nonceRes.json()) as { nonce: string }

	const password = derivePassword(username)
	const mac = makeMac(nonce, username, password, admin)

	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ nonce, username, password, mac, admin, displayname: username }),
	})

	if (!res.ok) {
		const body = (await res.json()) as { error?: string; errcode?: string }
		if (body.errcode === 'M_USER_IN_USE' || body.error?.includes('already')) return
		throw new Error(`User registration failed: ${JSON.stringify(body)}`)
	}
}
