import { config } from './config'
import { handleInstall } from './handlers/install'
import { handleWebhook } from './handlers/webhook'
import { handleSetupRegister } from './handlers/setup'

export function startServer(): void {
	Bun.serve({
		port: config.port,
		routes: {
			'/install': { POST: handleInstall },
			'/dialog/bitrix/handler/': { POST: handleWebhook },
			'/setup/register': { POST: handleSetupRegister },
		},
		fetch() {
			return new Response('Not Found', { status: 404 })
		},
	})

	console.log(`[server] listening on port ${config.port}`)
}
