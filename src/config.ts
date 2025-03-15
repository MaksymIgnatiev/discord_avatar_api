/*
 * This file is part of discord_avatar_api.
 * Copyright (c) 2025 MaksymIgnatiev.
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE.
 */


import type { Config, PositiveNumber } from "./types"
import "./extensions/response"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

// Comments indicates default values
export var config: Config = {
	ROOT: join(dirname(fileURLToPath(import.meta.url)), ".."), // 1 directory up (src)
	defaultExtension: "png", // "png"
	defaultSize: 2048 as PositiveNumber, // 2048
	avatarCacheTime: 600000 as PositiveNumber, // 600000, 10 minutes in `ms`
	cacheType: "fs", // "fs"
	server: {
		port: 7352, // 7352
		host: "0.0.0.0", // "0.0.0.0"
	},
}
