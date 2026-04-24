export async function logRequest(req: Request): Promise<void> {
	const headers: Record<string, string> = {}
	req.headers.forEach((value, key) => {
		headers[key] = value
	})

	let body: unknown = undefined
	const contentType = req.headers.get('content-type') ?? ''

	try {
		if (contentType.includes('application/json')) {
			body = await req.clone().json()
		} else if (
			contentType.includes('application/x-www-form-urlencoded') ||
			contentType.includes('multipart/form-data')
		) {
			const form = await req.clone().formData()
			body = Object.fromEntries(form)
		} else {
			const text = await req.clone().text()
			if (text) body = text
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
