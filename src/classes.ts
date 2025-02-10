export class TypedResponse<T> extends Response {
	/** Returns the promise with the resolved value as parsed JSON data from the response body, or with a rejected value of an error */
	override json(): Promise<T> {
		return super.json()
	}
}
