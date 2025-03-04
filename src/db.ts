import { config } from "./config"
import type { Avatar, AvatarExtension, AvatarExtensionTuple, Cache, CacheMap } from "./types"
import { join } from "path"
import fs from "fs"

var cacheMap: CacheMap = new Map(),
	cachePath = join(config.ROOT, ".cache"),
	avatarToString = function <
		I extends string = string,
		E extends AvatarExtension = AvatarExtension,
		S extends number = number,
	>(this: Avatar<I, E, S>): ReturnType<Avatar<I, E, S>["toString"]> {
		return `Avatar(id: ${this.id}, size: ${this.size}, ext: ${this.extension})`
	}

/** Just nice function to format avatar representation without all data */
export var formatAvatarString = function <
	I extends string = string,
	E extends AvatarExtension = AvatarExtension,
	S extends number = number,
>(id: I, extension: E, size: S): ReturnType<Avatar<I, E, S>["toString"]> {
	return `Avatar(id: ${id}, size: ${size}, ext: ${extension})`
}

// List of available image extensions
// See - https://discord.com/developers/docs/reference#image-formatting
export var fileExts: AvatarExtensionTuple = ["webp", "png", "gif", "jpeg", "jpg"]

export function createAvatar<
	I extends string = string,
	E extends AvatarExtension = AvatarExtension,
	S extends number = number,
>(data: Avatar["data"], id: I, extension: E, size: S, modifiedAt = Date.now()): Avatar<I, E, S> {
	return {
		data,
		id,
		modifiedAt,
		extension,
		size,
		toString: avatarToString,
	}
}

/** Function to call to ensure that cache directory is available */
export function checkAndCreateCacheDir() {
	!fs.existsSync(cachePath) && fs.mkdirSync(cachePath)
}

export var cache: Cache = {
	code: {
		set(id, avatar) {
			var has = cacheMap.has(id)
			var arr = has ? cacheMap.get(id)! : ([] as Avatar[])
			!arr.some((a) => a.extension === avatar.extension && avatar.size === a.size) &&
				arr.push(avatar)
			!has && cacheMap.set(id, arr)
		},
		// type cast, because ts can't recognise that function literal is already overloaded :(
		get: ((id: string, ext?: AvatarExtension, size?: number) => {
			var arr = cacheMap.get(id)
			// normalize parameter if one of them is not passed (very unlikely, but not impossible)
			if (ext || size) {
				if (ext && !size) size = config.defaultSize
				if (!ext && size) ext = config.defaultExtension
			}
			return ext ? arr?.find((a) => a.extension === ext && a.size === size) : arr
		}) as unknown as Cache["code"]["get"],
		has: ((id: string, ext?: AvatarExtension, size?: number) => {
			if (ext || size) {
				if (ext && !size) size = config.defaultSize
				if (!ext && size) ext = config.defaultExtension
			}
			var has = cacheMap.has(id)
			return (
				(has &&
					ext &&
					cacheMap.get(id)?.some((a) => a.extension === ext && a.size === size)) ||
				has
			)
		}) as unknown as Cache["code"]["has"],
		delete: ((id: string, ext?: AvatarExtension, size?: number) => {
			if (ext || size) {
				if (ext && !size) size = config.defaultSize
				if (!ext && size) ext = config.defaultExtension
			}
			var arr = cacheMap.get(id)
			if (ext) {
				var idx = arr && arr.findIndex((a) => a.extension === ext && a.size === size)
			}
			return ext
				? idx === undefined
					? false
					: idx === -1
						? false
						: (arr?.splice(idx, 1), true)
				: cacheMap.delete(id)
		}) as unknown as Cache["code"]["delete"],
		checkTime(id, ext, size) {
			return (
				cache.code.has(id, ext, size) &&
				cache.code.get(id, ext, size)!.modifiedAt > config.avatarCacheTime
			)
		},
	},
	fs: {
		set(id, avatar) {
			checkAndCreateCacheDir()
			Bun.write(
				Bun.file(join(cachePath, `${id}_${avatar.size}.${avatar.extension}`)),
				avatar.data,
			)
		},
		get: wrapFsFunc((async (id: string, ext?: AvatarExtension, size?: number) => {
			if (ext || size) {
				if (ext && !size) size = config.defaultSize
				if (!ext && size) ext = config.defaultExtension
			}
			var file = join(cachePath, id)
			if (ext && size) {
				var bunFile = Bun.file(`${file}_${size}.${ext}`)
				return bunFile
					.exists()
					.then((e) =>
						e
							? bunFile
									.arrayBuffer()
									.then((a) =>
										createAvatar(
											new Uint8Array(a),
											id,
											ext as AvatarExtension,
											size as number,
											bunFile.lastModified,
										),
									)
							: undefined,
					)
			} else {
				ext = config.defaultExtension
				size = config.defaultSize
				var filenames = fs
					.readdirSync(cachePath)
					.filter((name) => name.includes(id) && fileExts.some((e) => name.includes(e)))
				return Promise.allSettled(
					filenames.map(async (filename) => {
						var bunFile = Bun.file(join(cachePath, filename))
						return bunFile.arrayBuffer().then((a) =>
							createAvatar(
								new Uint8Array(a),
								id,
								// file extension should be available, but who knows :)
								(filename.match(/\w+$/)?.[0] as AvatarExtension) ??
									config.defaultExtension,

								bunFile.lastModified,
							),
						)
					}),
				).then((results) =>
					results.filter((res) => res.status === "fulfilled").map((res) => res.value),
				)
			}
		}) as unknown as Cache["fs"]["get"]),
		has: wrapFsFunc(((id: string, ext?: AvatarExtension, size?: number) => {
			if (ext || size) {
				if (ext && !size) size = config.defaultSize
				if (!ext && size) ext = config.defaultExtension
			}
			return ext
				? fs.existsSync(join(cachePath, `${id}_${size}.${ext}`))
				: fs.readdirSync(cachePath).some((name) => name.includes(id))
		}) as unknown as Cache["fs"]["has"]),
		delete: wrapFsFunc((async (id: string, ext?: AvatarExtension, size?: number) => {
			if (ext || size) {
				if (ext && !size) size = config.defaultSize
				if (!ext && size) ext = config.defaultExtension
			}

			var file = Bun.file(join(cachePath, `${id}_${size}.${ext}`))
			return file.exists().then(
				(e) =>
					e &&
					file.unlink().then(
						() => true,
						() => false,
					),
			)
		}) as unknown as Cache["fs"]["delete"]),
		checkTime(id, ext, size) {
			checkAndCreateCacheDir()
			return (
				cache.fs.has(id, ext, size) &&
				Bun.file(join(cachePath, `${id}_${size}.${ext}`)).lastModified >
					config.avatarCacheTime
			)
		},
		getIds: wrapFsFunc(((withExt?: boolean) => {
			return fs.readdirSync(cachePath).reduce((a, name) => {
				if (!withExt) name = name.match(/^\d+/)?.[0] || ""
				name !== "" && !a.includes(name) && a.push(name)
				return a
			}, [] as string[])
		}) as unknown as Cache["fs"]["getIds"]),
	},
}

/** Wraps the function that interacts with fs with checking function to ensure that cache directory is available */
function wrapFsFunc<T extends (...args: any[]) => any>(fn: T): T {
	return ((...args: Parameters<T>) => {
		checkAndCreateCacheDir()
		return fn(...args)
	}) as unknown as T
}

/** Execute callback on specific cache type */
export function onCacheType(code: () => void, fs: () => void) {
	config.cacheType === "code" ? code() : fs()
}

// check for outdated cache (if not permanently)
if (config.avatarCacheTime != -1 && config.avatarCacheTime > 0) {
	setInterval(() => {
		if (config.cacheType === "code") {
			for (var [idCode, value] of cacheMap.entries()) {
				for (var avatar of value) {
					if (cache.code.checkTime(idCode, avatar.extension, avatar.size))
						cache.code.delete(idCode, avatar.extension, avatar.size)
				}
			}
		} else {
			for (var id of cache.fs.getIds(true)) {
				var filename = id.match(/^\d+/)?.[0] ?? "",
					size = +(id.match(/(?<=^\d+_)\d+/)?.[0] ?? config.defaultSize),
					fileExt = (id.match(/\w+$/)?.[0] as AvatarExtension) ?? config.defaultExtension

				if (cache.fs.checkTime(filename, fileExt, size))
					cache.fs.delete(filename, fileExt, size)
			}
		}
	}, config.avatarCacheTime)
}
