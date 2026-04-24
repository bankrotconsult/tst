export const config = {
	port: parseInt(process.env.PORT ?? '8007'),

	bitrix: {
		domain: 'b24-tq8b7v.bitrix24.ru',
		clientId: process.env.BITRIX_CLIENT_ID!,
		clientSecret: process.env.BITRIX_CLIENT_SECRET!,
	},

	connector: {
		id: 'bk_chat_connector',
		name: 'BK Chat',
		color: '#2D6BFF',
		webhookUrl: 'https://api.bk-dev.ru/dialog/bitrix/handler/',
	},

	tokenFile: 'data/.tokens.json',
}
