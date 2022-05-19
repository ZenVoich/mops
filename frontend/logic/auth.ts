import {AuthClient} from '@dfinity/auth-client'
import EventEmitter from 'events'

type LoginArgs = {
	onSuccess?: Function;
	onError?: Function;
}

class Auth extends EventEmitter {
	isAuthenticated = false
	identity: any = null
	principal = ''

	_client: AuthClient

	async getClient() {
		this._client = this._client || await AuthClient.create()
		return this._client
	}

	async updateAuthState() {
		let client = await this.getClient()
		let oldIsAuth = this.isAuthenticated
		this.isAuthenticated = await client.isAuthenticated()

		if (this.isAuthenticated) {
			this.identity = client.getIdentity()
			this.principal = this.identity.getPrincipal().toString()
		}
		else {
			this.identity = null
			this.principal = ''
		}

		if (oldIsAuth !== this.isAuthenticated) {
			this.emit('update')
		}
	}

	async login({onSuccess, onError}: LoginArgs = {}) {
		let client = await this.getClient()
		return new Promise((resolve) => {
			client.login({
				identityProvider: 'https://identity.ic0.app',
				maxTimeToLive: 1_000_000n * 1000n * 60n * 60n * 24n * 10n,
				onSuccess: () => {
					this.updateAuthState()
					onSuccess && onSuccess()
					resolve(true)
				},
				onError: (error) => {
					console.error('auth error', error)
					this.updateAuthState()
					onError && onError()
					resolve(false)
				},
			})
		})
	}

	async logout() {
		let client = await this.getClient()
		await client.logout()
		this.updateAuthState()
	}
}

export let auth = new Auth