import type { TypedResponse } from "./classes"
import { config } from "./config"
import type { AvatarExtension, DiscordUser, ExplanationToAPIResponse, NotEmpty } from "./types"

var DISCORD_API_BOT_TOKEN = Bun.env.DISCORD_API_BOT_TOKEN

if (DISCORD_API_BOT_TOKEN === undefined) {
	console.error("Error: Bot token is not set")
	process.exit(1)
}

export function fetchUserObject<I extends string>(
	userID: NotEmpty<I>,
): Promise<TypedResponse<DiscordUser>> {
	return fetch(`https://discord.com/api/v9/users/${userID}`, {
		headers: {
			Authorization: `Bot ${DISCORD_API_BOT_TOKEN}`,
		},
	}) as Promise<TypedResponse<DiscordUser>>
}

export function fetchUserAvatar<
	UI extends string,
	AI extends string,
	Size extends number = typeof config.defaultSize,
	Ext extends AvatarExtension = typeof config.defaultExtension,
>(
	userID: NotEmpty<UI>,
	avatarID: NotEmpty<AI>,
	size = config.defaultSize as Size,
	ext = config.defaultExtension as Ext,
) {
	return fetch(`https://cdn.discordapp.com/avatars/${userID}/${avatarID}.${ext}?size=${size}`)
}

/** Memoizes all parameters, and returns the function that returns a promise to a Uint8Array of an image, or `null` if error occured */
export function memoFetchUserObject<
	ID extends string,
	Size extends number = typeof config.defaultSize,
	Ext extends AvatarExtension = typeof config.defaultExtension,
>(userID: NotEmpty<ID>, size = config.defaultSize as Size, ext = config.defaultExtension as Ext) {
	var userObject = fetchUserObject(userID)
	return () =>
		new Promise<Uint8Array | null>((resolve) => {
			userObject.then((res) =>
				res
					.onsuccess(() =>
						res
							.json()
							.then((json) =>
								json.avatar
									? fetchUserAvatar(userID, json.avatar, size, ext)
									: null,
							)
							.then((res) =>
								resolve(res === null ? null : res.ok ? res.bytes() : null),
							),
					)
					.onfailure(() => resolve(null)),
			)
		})
}

/** Memoizes all parameters, and returns the function that returns a promise to a Uint8Array of an image or object with explicit error on each step, if error occured */
export function explicitMemoFetchUserObject<
	ID extends string,
	Size extends number = typeof config.defaultSize,
	Ext extends AvatarExtension = typeof config.defaultExtension,
>(userID: NotEmpty<ID>, size = config.defaultSize as Size, ext = config.defaultExtension as Ext) {
	var userObject = fetchUserObject(userID)
	return () =>
		new Promise<Uint8Array | ExplanationToAPIResponse>((resolve) => {
			userObject.then((res) =>
				res
					.onsuccess(() =>
						res
							.json()
							.then((json) =>
								json.avatar
									? fetchUserAvatar(userID, json.avatar, size, ext)
									: (resolve({ key: "noAvatar", response: res }), res),
							)
							.then((res) =>
								resolve(
									res && res.ok
										? res.bytes()
										: { key: "fethingAvatar", response: res },
								),
							),
					)
					.onfailure(() => resolve({ key: "fethingUser", response: res })),
			)
		})
}
