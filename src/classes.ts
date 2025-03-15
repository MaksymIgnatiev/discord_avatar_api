/*
 * This file is part of discord_avatar_api.
 * Copyright (c) 2025 MaksymIgnatiev.
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE.
 */


export class TypedResponse<T> extends Response {
	/** Returns the promise with the resolved value as parsed JSON data from the response body, or with a rejected value of an error */
	override json(): Promise<T> {
		return super.json()
	}
}
