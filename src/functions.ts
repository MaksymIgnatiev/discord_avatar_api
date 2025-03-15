/*
 * This file is part of discord_avatar_api.
 * Copyright (c) 2025 MaksymIgnatiev.
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE.
 */


import { existsSync, mkdirSync } from "fs"
import type { TypedResponse } from "./classes"
import { config } from "./config"
import type {
	AvatarExtension,
	Config,
	DiscordUser,
	ExplanationToAPIResponse,
	FlagErrorType,
	NotEmpty,
	PositiveNumber,
} from "./types"
import { fileExts } from "./db"
import { sep } from "path"

var { DISCORD_API_BOT_TOKEN } = Bun.env

if (DISCORD_API_BOT_TOKEN === undefined) {
	console.error("Error: Bot token is not set")
	process.exit()
}

export function fetchUserObject<I extends string>(
	userID: NotEmpty<I>,
): Promise<TypedResponse<DiscordUser>> {
	return fetch(`https://discord.com/api/v9/users/${userID}`, {
		headers: {
			// only place where bot token is realy needed
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
	size = config.defaultSize as unknown as Size,
	ext = config.defaultExtension as Ext,
) {
	return fetch(`https://cdn.discordapp.com/avatars/${userID}/${avatarID}.${ext}?size=${size}`)
}

/** Memoizes all parameters, and returns the function that returns a promise to a Uint8Array of an image, or `null` if error occured */
export function memoFetchUserObject<
	ID extends string,
	Size extends number = typeof config.defaultSize,
	Ext extends AvatarExtension = typeof config.defaultExtension,
>(
	userID: NotEmpty<ID>,
	size = config.defaultSize as unknown as Size,
	ext = config.defaultExtension as Ext,
) {
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
>(
	userID: NotEmpty<ID>,
	size = config.defaultSize as unknown as Size,
	ext = config.defaultExtension as Ext,
) {
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

export function isFlag(arg: string) {
	return /^-{1,2}/.test(arg)
}

function flagError<T extends FlagErrorType>(
	type: T,
	flag: string,
	available: string | string[],
	defaults: any,
) {
	console.log(
		`${type === "noValue" ? `Flag '${flag}' haven't got any value` : `Flag '${flag}' accepted wrong value`}. ${Array.isArray(available) ? `Available values: ${available.join(" | ")}` : `Value can be: ${available}`}. Defaulting to '${defaults}'`,
	)
}

// too lazy to make necessary infrastructure
export function parseFlags(args: string[]) {
	for (var i = 0; i < args.length; i++) {
		var argRaw = args[i]
		if (argRaw.match(/^-{1,2}/)) {
			var flag = argRaw.replace(/^-{1,2}/, "")
			if (flag.match(/^(t|cache-type)$/)) {
				var arg = args[i + 1]
				if (arg === undefined || isFlag(arg)) {
					flagError("noValue", argRaw, "fs | code", config.cacheType)
					continue
				}
				if (!arg.match(/^(fs|code)$/)) {
					flagError("incorrectValue", argRaw, "fs | code", config.cacheType)
				} else config.cacheType = arg as Config["cacheType"]
				i++
			} else if (flag.match(/^(ct|cache-time)$/)) {
				var arg = args[i + 1]
				if (arg === undefined || isFlag(arg)) {
					flagError(
						"noValue",
						argRaw,
						"positive number | -1 (for disabling cache checks)",
						config.avatarCacheTime,
					)
					continue
				}
				if (!arg.match(/^-1$|^\d+$/) || arg === "0") {
					flagError(
						"incorrectValue",
						argRaw,
						"positive number | -1 (for disabling cache checks)",
						config.avatarCacheTime,
					)
				} else config.avatarCacheTime = +arg as PositiveNumber
				i++
			} else if (flag.match(/^(s|default-size)$/)) {
				var arg = args[i + 1]
				if (arg === undefined || isFlag(arg)) {
					flagError("noValue", argRaw, "positive number", config.defaultSize)
					continue
				}
				if (!arg.match(/^\d+$/) || arg === "0") {
					flagError("incorrectValue", argRaw, "positive number", config.defaultSize)
				} else config.defaultSize = +arg as PositiveNumber
				i++
			} else if (flag.match(/^(e|default-extension)$/)) {
				var arg = args[i + 1]
				if (arg === undefined || isFlag(arg)) {
					flagError("noValue", argRaw, fileExts, config.defaultExtension)
					continue
				}
				if (!validExtension(arg)) {
					flagError("incorrectValue", argRaw, fileExts, config.defaultExtension)
				} else config.defaultExtension = arg as AvatarExtension
				i++
			} else if (flag.match(/^(sh|server-host)$/)) {
				var arg = args[i + 1]
				if (arg === undefined || isFlag(arg)) {
					flagError("noValue", argRaw, "string representing the host", config.server.host)
					continue
				} else config.server.host = arg
				i++
			} else if (flag.match(/^(sp|server-port)$/)) {
				var arg = args[i + 1]
				if (arg === undefined || isFlag(arg)) {
					flagError("noValue", argRaw, "positive number", config.server.port)
					continue
				}
				if (!arg.match(/^\d+$/)) {
					flagError("incorrectValue", argRaw, "positive number", config.server.port)
				} else config.server.port = +arg as PositiveNumber
				i++
			} else console.log(`Unknown flag: ${argRaw}`)
		} else console.log(`Unknown argument: ${argRaw}`)
	}
}

export function checkcAndCreateDir(path: string) {
	!existsSync(path) && mkdirSync(path, { recursive: true })
}

export function validExtension(ext: string) {
	return fileExts.includes(ext as AvatarExtension)
}
export function isDirNotation(path: string) {
	return path.endsWith(sep)
}

export async function getOneLineSTDIN() {
	var iterator = process.stdin.iterator()
	var result = (await iterator.next()).value.toString().trim()
	process.stdin.destroy() // closing stdin to not block the event loop
	return result
}

export function stdinPrompt(prompt: string) {
	return new Promise<string>((res, rej) => {
		process.stdout.write(prompt)
		getOneLineSTDIN().then(res, rej)
	})
}
