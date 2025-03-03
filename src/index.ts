/*
 * This file is part of discord_avatar_api.
 * Copyright (c) 2025 MaksymIgnatiev.
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE.
 */

import { Hono, type Context } from "hono"
import { explicitMemoFetchUserObject, parseFlags } from "./functions"
import { logger } from "hono/logger"
import { config } from "./config"
import { cache, createAvatar, fileExts, onCacheType } from "./db"
import type { Avatar, AvatarExtension } from "./types"
import rootHtml from "../public/index.html"
import { join } from "path"

var argv = process.argv,
	arg = argv[2]

if (/^-h$|^--help$/.test(arg)) {
	console.log(
		`Usage: bun start [flags...]

FLAGS:
	-h, --help               Show this message
	-c, --cache-type <type>  Which cache type to use: code | fs`,
	)
	process.exit()
}

var app = new Hono(),
	noContent = (c: Context) => {
		c.header("Cache-Control", `public, max-age=2592000`) // 30 days
		c.status(204)
		return c.json({ ok: true, code: 204, statusText: "No Content" })
	},
	favicon = Bun.file(join(config.ROOT, "public", "images", "favicon.png"))

function dataResponse<E extends AvatarExtension>(data: Avatar["data"], ext: E) {
	return new Response(data, {
		headers: { "Content-Type": `image/${ext}` },
		status: 200,
	})
}

app.get("/favicon.ico", (_) => {
	return new Promise((resolve) => {
		resolve(
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
			(extRaw &&
				fileExts.includes(extRaw as AvatarExtension) &&
				(extRaw as AvatarExtension)) ||
			config.defaultExtension

	if (!/^\d+(\.\w{3,4})?$/.test(id)) {
		return c.json(
			{
				ok: false,
				code: 400,
				message:
					"Id/query is not a number/valid query (query layout: `{number}.{extension}`)",
			},
			400,
		)
	} else if (/^\d+\.\w{3,4}$/.test(id)) {
		console.log(`Extension is in the query: ${id}`)
		var ext_ = id.match(/\w+$/)![0] as AvatarExtension
		id = id.match(/^\d+/)![0]
		if (fileExts.includes(ext_)) ext = ext_
	}
	// cache check
	if (config.cacheType === "code") {
		if (cache.code.has(id, ext, size)) {
			console.log(`Avatar(id: ${id}, size: ${size}, ext: ${ext}) is in the code cache`)
			return dataResponse(cache.code.get(id, ext, size)!.data, ext)
		}
	} else {
		if (cache.fs.has(id, ext, size)) {
			console.log(`${id}_${size}.${ext} is in the fs cache`)
			return cache.fs.get(id, ext, size).then((avatar) => dataResponse(avatar!.data, ext))
		}
	}
	console.log(`Fetching avatar for: Avatar(id: ${id}, size: ${size}, ext: ${ext})`)
	// too lazy to make it readable, because it's effisient
	return explicitMemoFetchUserObject(id, size, ext)().then((data) => {
		return new Promise((resolve) => {
			if ("key" in data) {
				if (data.key === "fethingUser")
					resolve(
						c.json({ ok: false, code: 400, message: "Error while fething user" }, 400),
					)
				else if (data.key === "fethingAvatar")
					resolve(
						c.json(
							{ ok: false, code: 400, message: "Error while fething avatar" },
							400,
						),
					)
				else
					resolve(
						c.json(
							{ ok: false, code: 422, message: "User don't have any avatar" },
							422,
						),
					)
			} else {
				var avatar = createAvatar(data, id, ext, size)
				onCacheType(
					() => cache.code.set(id, avatar),
					() => cache.fs.set(id, avatar),
				)
				resolve(dataResponse(data, ext))
			}
		})
	})
})

parseFlags(process.argv.slice(2))

var server = Bun.serve({
	static: { "/": rootHtml },
	fetch: app.fetch,
	port: config.server.port,
	hostname: config.server.host,
})

console.log(`Listening on URL: ${server.url}`)
