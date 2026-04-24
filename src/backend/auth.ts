const INTERNAL_SECRET = process.env.BK_CHAT_INTERNAL_SECRET ?? ''

export function verifyInternalSecret(req: Request): boolean {
	const secret = req.headers.get('x-internal-secret') ?? ''
	return !!INTERNAL_SECRET && secret === INTERNAL_SECRET
}
