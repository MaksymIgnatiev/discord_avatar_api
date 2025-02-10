import type { Config } from "./types"
import "./extensions/response"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

export var config: Config = {
	ROOT: join(dirname(fileURLToPath(import.meta.url)), "../"), // 1 directory up (src)
	defaultExtension: "png", // "png"
	defaultSize: 2048, // 2048
	avatarCacheTime: 600000, // 600000, 10 minutes in `ms`
	cacheType: "code", // "code"
	server: {
		port: 7352, // 7352
		host: "0.0.0.0", // "0.0.0.0"
	},
}
