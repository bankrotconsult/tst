import { createClient, type MatrixClient } from 'matrix-js-sdk'
import { matrixConfig } from './config'

// Creates a Matrix client that makes all requests impersonating the given user (AS protocol).
// The SDK appends ?user_id= to every request via queryParams.
export function createAsClient(userId: string): MatrixClient {
	return createClient({
		baseUrl: matrixConfig.homeserver,
		accessToken: matrixConfig.asToken,
		queryParams: { user_id: userId },
	})
}

export function matrixUserId(localpart: string): string {
	return `@${localpart}:${matrixConfig.domain}`
}
