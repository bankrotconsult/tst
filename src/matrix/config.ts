export const matrixConfig = {
	homeserver: process.env.MATRIX_HOMESERVER ?? 'http://synapse:8008',
	domain: process.env.MATRIX_DOMAIN ?? 'localhost',
	asToken: process.env.MATRIX_AS_TOKEN ?? '',
	hsToken: process.env.MATRIX_HS_TOKEN ?? '',
	sharedSecret: process.env.MATRIX_SHARED_SECRET ?? '',
	adminToken: process.env.MATRIX_ADMIN_TOKEN ?? '',
}
