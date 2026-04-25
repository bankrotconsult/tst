import { registerConnector } from '../connector/register'

export async function handleSetupRegister(): Promise<Response> {
	try {
		await registerConnector()
		return Response.json({ ok: true })
	} catch (err) {
		console.error('[setup] register failed:', err)
		return Response.json({ ok: false, error: String(err) }, { status: 500 })
	}
}
