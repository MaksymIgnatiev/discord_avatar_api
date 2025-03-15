/*
 * This file is part of discord_avatar_api.
 * Copyright (c) 2025 MaksymIgnatiev.
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE.
 */

import { Hono, type Context } from "hono"
import { explicitMemoFetchUserObject, parseFlags, validExtension } from "./functions"
import { logger } from "hono/logger"
import { config } from "./config"
import { cache, createAvatar, fileExts, formatAvatarString } from "./db"
import type { Avatar, AvatarExtension } from "./types"
import rootHtml from "../public/index.html"
import { join } from "path"
import type { StatusCode } from "hono/utils/http-status"

var argv = process.argv,
	arg = argv[2]

if (/^(-h|--help)$/.test(arg)) {
	console.log(
		`Usage: bun start [flags...]

FLAGS:
    -h , --help                        Show this message
    -t , --cache-type <type>           Which cache type to use: code | fs
    -ct, --cache-time <ms>             Cache time for the avatars: positive number | -1 (disable checking)
    -s , --default-size <number>       Default size for all images: positive number
    -e , --default-extension <number>  Default extension for all images: ${fileExts.join(" | ")}
    -sh, --server-host <string>        Host fot the server: string (e.g. localhost, 0.0.0.0, etc.)
    -sp, --server-port <number>        Port fot the server: positive number`,
	)
	process.exit()
}

var app = new Hono(),
	noContent = (c: Context) => {
		c.header("Cache-Control", `public, max-age=2592000`) // 30 days
		c.status(204)
		return c.json({ ok: true, code: 204 as const, statusText: "No Content" as const })
	},
	incorrectUsage = (c: Context, message: string, code = 400 as StatusCode) => {
		c.status(code)
		return c.json({ ok: false, code, message })
	},
	favicon = Bun.file(join(config.ROOT, "public", "images", "favicon.png"))

function dataResponse<E extends AvatarExtension>(data: Avatar["data"], ext: E) {
	return new Response(data, {
		headers: { "Content-Type": `image/${ext}` },
		status: 200,
	})
}

app.get("/favicon.ico", () => {
	return new Promise((resolve) => {
		resolve(
			// generating buffer each time, because image may change during runtime,
			// and Bun.file stores only refferense to a file, not the actual content of a file
			favicon.arrayBuffer().then(
				(arrbuf) =>
					new Response(arrbuf, {
						headers: {
							"Content-Type": "image/png",
						},
					}),
			),
		)
	})
})
app.use("/:id", logger())
app.get("/:id", async (c) => {
	var id = c.req.param("id"),
		extRaw = c.req.query("ext"),
		sizeRaw = c.req.query("size"),
		size = (sizeRaw && !Number.isNaN(+sizeRaw) && +sizeRaw) || config.defaultSize,
		ext =
			(extRaw && validExtension(extRaw) && (extRaw as AvatarExtension)) ||
			config.defaultExtension

	if (!/^\d+(\.\w{3,4})?$/.test(id)) {
		return incorrectUsage(
			c,
			`Id/query is not a number/valid query (query layout: '<id[.extension]>', where: id - positive number; extension - one of valid extensions: ${fileExts.join(" | ")})`,
		)
	} else if (/^\d+\.\w{3,4}$/.test(id)) {
		var ext_ = id.match(/\w+$/)![0] as AvatarExtension
		id = id.match(/^\d+/)![0]
		if (validExtension(ext_)) ext = ext_
		else
			return incorrectUsage(
				c,
				`Unsupported file extension: '${ext_}'. Use one of these: ${fileExts.join(" | ")}; or read 'https://discord.com/developers/docs/reference#image-formatting-image-formats' to see valid image formats`,
			)
	}

	if (extRaw && !validExtension(extRaw))
		return incorrectUsage(
			c,
			`Unsupported file extension: '${extRaw}'. Use one of these: ${fileExts.join(" | ")}; or read 'https://discord.com/developers/docs/reference#image-formatting-image-formats' to see valid image formats (if the API is out of date)`,
		)

	if (sizeRaw && !/^\d+$/.test(sizeRaw))
		return incorrectUsage(c, `Size parameter (${sizeRaw}) is not a positive number`)

	if (sizeRaw && (+sizeRaw < 1 || +sizeRaw > 2048))
		return incorrectUsage(c, `Size parameter (${sizeRaw}) out of bound (1 - 2048)`)

	/*
		should i also check extension and size parameters?
		or it's better to default them to not bother?
		i think it's better to default them,
		because it's javascript baby 😎

		@see https://tc39.es/ecma262/multipage/
	*/

	// cache check
	if (config.cacheType === "code") {
		if (cache.code.has(id, ext, size)) {
			console.log(`${formatAvatarString(id, ext, size)} is in the code cache`)
			return dataResponse(cache.code.get(id, ext, size)!.data, ext)
		}
	} else {
		if (cache.fs.has(id, ext, size)) {
			console.log(`${id}_${size}.${ext} is in the fs cache`)
			return cache.fs.get(id, ext, size).then((avatar) => dataResponse(avatar!.data, ext))
		}
	}

	console.log(`Fetching avatar for: ${formatAvatarString(id, ext, size)}`)

	// too lazy to make it readable, because it's efficient
	return explicitMemoFetchUserObject(id, size, ext)().then((data) => {
		return new Promise((resolve) => {
			if ("key" in data) {
				if (data.key === "fethingUser")
					resolve(incorrectUsage(c, "Error while fething user"))
				else if (data.key === "fethingAvatar")
					resolve(incorrectUsage(c, "Error while fething avatar"))
				else resolve(incorrectUsage(c, "User don't have any avatar", 422))
			} else {
				var avatar = createAvatar(data, id, ext, size)
				cache[config.cacheType].set(id, avatar)
				resolve(dataResponse(data, ext))
			}
		})
	})
})

// Send 204 for all other routes
app.get("*", noContent)

parseFlags(process.argv.slice(2))

var server = Bun.serve({
	// might add dynamic page to explore avatars in the future ???
	// contributions are welcome (preferable not vanila react, because it's too bloated) :)
	static: { "/": rootHtml },
	fetch: app.fetch,
	port: config.server.port,
	hostname: config.server.host,
})

console.log(`Listening on URL: ${server.url}`)
