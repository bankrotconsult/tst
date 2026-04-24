import { config } from './config'
import { handleInstall } from './handlers/install'
import { handleWebhook } from './handlers/webhook'
import { handleSetupRegister } from './handlers/setup'
import { logRequest } from './middleware/logger'

type Handler = (req: Request) => Promise<Response>

function withLogging(handler: Handler): Handler {
	return async (req) => {
		await logRequest(req)
		return handler(req)
	}
}

export function startServer(): void {
	Bun.serve({
		port: config.port,
		routes: {
			'/install': { POST: withLogging(handleInstall) },
			'/dialog/bitrix/handler/': { POST: withLogging(handleWebhook) },
			'/setup/register': { POST: withLogging(handleSetupRegister) },
		},
		async fetch(req) {
			await logRequest(req)
			return new Response('Not Found', { status: 404 })
		},
	})

	console.log(`[server] listening on port ${config.port}`)
}
