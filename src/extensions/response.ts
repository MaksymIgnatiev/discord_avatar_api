declare global {
	interface Response {
		/** Execute a callback if the `response.ok` is `true`, and return the response object */
		onsuccess(callback: (response: Response) => void): this
		/** Execute a callback if the `response.ok` is `false`, and return the response object */
		onfailure(callback: (response: Response) => void): this
	}
}

Response.prototype.onsuccess = function (callback: (response: Response) => void): Response {
	if (this.ok) {
		callback(this)
	}
	return this
}

Response.prototype.onfailure = function (callback: (response: Response) => void): Response {
	if (!this.ok) {
		callback(this)
	}
	return this
}

export {}
