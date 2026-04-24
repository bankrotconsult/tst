export async function logRequest(req: Request): Promise<void> {
	const headers: Record<string, string> = {}
	req.headers.forEach((value, key) => {
		headers[key] = value
	})

	let body: unknown = undefined
	const contentType = req.headers.get('content-type') ?? ''

	try {
		const text = await req.clone().text()
		if (text) {
			if (contentType.includes('application/json')) {
				body = JSON.parse(text)
			} else if (contentType.includes('application/x-www-form-urlencoded')) {
				body = Object.fromEntries(new URLSearchParams(text))
			} else {
				body = text
			}
		}
	} catch {
		body = '<unreadable>'
	}

	console.log(
		`[${new Date().toISOString()}] ${req.method} ${req.url}\n` +
			`Headers: ${JSON.stringify(headers, null, 2)}\n` +
			`Body: ${JSON.stringify(body, null, 2)}`,
	)
}
