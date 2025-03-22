/*
 * This file is part of discord_avatar_api.
 * Copyright (c) 2025 MaksymIgnatiev.
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE.
 */

import { config } from "./config"
import { fileExts } from "./db"
import { join, isAbsolute, dirname } from "path"
import { existsSync, lstatSync, mkdirSync } from "fs"
import {
	explicitMemoFetchUserObject,
	isDirNotation,
	stdinPrompt,
	validExtension,
} from "./functions"
import type { AvatarExtension } from "./types"

var [flag, originalFilename, originalPath] = process.argv.slice(2)
var extJoined = fileExts.join(", "),
	exit = process.exit.bind(process),
	conf = {
		baseDir: "fetched",
		askOverride: false,
	},
	out = {
		fullPath: "",
		id: "",
		fileNameFull: "",
		fileBaseName: "",
		fileExt: "",
		fileDestDir: "",
	},
	pathExists: boolean,
	dirExists: boolean,
	isDir: boolean

function extensionIsntValid(ext: string) {
	console.log(
		`Extension '${ext}' is not recognized as valid. Use one of: ${extJoined}. Read also https://discord.com/developers/docs/reference#image-formatting for more up-to-date info if this application is out of date`,
	)
	exit(1)
}

if (flag !== "-f") process.exit()
if (originalFilename === "-h" || originalFilename === "--help") {
	console.log(
		`Usage: bun fetch <id[.ext]> [path]
\`ext\` can be one of: ${extJoined}; or may be skipped (defaults to: ${config.defaultExtension})
\`path\` can be as a relative/absolute path to file or directory:
    - if 'path' ends with extension - 'ext' will be ignored; check and save avatar at this path
    - if 'path' ends not with extension:
        - if 'path' points to the directory - check and save file in that directory as '\${id}.\${ext}'
        - if 'path' points to unknown place - script will treat it as a file, and save the avatar as is ('ext' as format)
        - if 'path' ends with '/' - check for directory: if exists - same as above; else create before previous step
    - if 'path' is omited - save avatar as '\${id}.\${ext}' to the './fetched/' directory

All actions on exsisting files will be asked before performing any actions!`,
	)
	exit()
}
if (originalFilename === undefined) {
	console.log(`Destination ID is not specified`)
	exit(1)
}
var idTemplate: RegExpMatchArray | null

if (!(idTemplate = originalFilename.match(/^(\d+)(\.\w{3,5})?$/))) {
	console.log(
		`Fetch: ID object needs to be one of: 'XXXXXXXXXXXXXXXXXX' or 'XXXXXXXXXXXXXXXXXX.ext' templates, where 'X' - any digit, 'XXX...' represents discord user id, and 'ext' represents desired file format (one of: ${extJoined}; default: ${config.defaultExtension})`,
	)
	exit(1)
} else {
	out.fileBaseName = idTemplate[1]
	out.id = idTemplate[1]
	out.fileNameFull = `${out.id}.${out.fileExt}`
	if (idTemplate[2] !== undefined) {
		idTemplate[2] = idTemplate[2].slice(1)
		if (validExtension(idTemplate[2])) out.fileExt = idTemplate[2]
		else extensionIsntValid(idTemplate[2])
	}
}

if (originalPath === undefined) {
	out.fileDestDir = join(config.ROOT, conf.baseDir)
	if (!out.fileExt) out.fileExt = config.defaultExtension
	originalPath = join(out.fileDestDir, `${out.fileBaseName}.${out.fileExt}`)
	out.fullPath = originalPath
} else {
	var pathArg = originalPath.match(/^([\s\S]+)(?:\.([a-zA-Z0-9]+))$|^([\s\S]+)$/)

	if (!pathArg) {
		console.log(`Could not recognize the path to save image`)
		exit(1)
	} else {
		var { 1: pathFilePath, 2: pathFileExt } = pathArg
		if (!pathFilePath) pathFilePath = pathArg[3]

		if (pathFilePath) out.fileBaseName = pathFilePath
		if (!out.fileExt) {
			if (!pathFileExt) out.fileExt = config.defaultExtension
			else out.fileExt = pathFileExt
		}

		if (isAbsolute(pathFilePath)) {
			if (validExtension(out.fileExt)) {
				if (isDirNotation(pathFilePath))
					out.fullPath = join(pathFilePath, `${out.id}.${out.fileExt}`)
				else out.fullPath = `${pathFilePath}.${out.fileExt}`
			} else extensionIsntValid(pathFileExt)
		} else if (pathFileExt) {
			// file
			if (validExtension(pathFileExt)) out.fileExt = pathFileExt
			else extensionIsntValid(pathFileExt)

			out.fullPath = join(config.ROOT, `${pathFilePath}.${out.fileExt}`)
		} else {
			// directory or file with no extension
			var pathLike = join(config.ROOT, out.fileDestDir, pathFilePath)

			pathExists = existsSync(pathLike)
			isDir = pathExists ? lstatSync(pathLike).isDirectory() : false

			if (isDir) {
				// directory (exsisting)
				out.fileNameFull = `${out.id}.${out.fileExt}`
				out.fullPath = join(pathLike, out.fileNameFull)
			} else {
				isDir = isDirNotation(pathLike)
				if (isDir) {
					// directory (non exsisting)
					out.fileDestDir = pathLike
					out.fileNameFull = `${out.id}.${out.fileExt}`
					out.fullPath = join(out.fileDestDir, out.fileNameFull)
				} else {
					// file
					out.fullPath = join(`${pathLike}.${out.fileExt}`)
				}
			}
		}
	}
}

out.fileDestDir = dirname(out.fullPath)

dirExists = existsSync(out.fileDestDir)
pathExists = existsSync(out.fullPath)
console.log(`Saving into: ${out.fullPath}`)

Promise.resolve()
	.then(() => {
		return new Promise<void>((resolve) => {
			if (!dirExists) {
				stdinPrompt(
					`Directory ${out.fileDestDir} does not exist. Would you like to create it? [Y/n]: `,
				).then((answer) => {
					if (answer.match(/y(es)?/i) || answer === "") {
						mkdirSync(out.fileDestDir, { recursive: true })
						console.log(`Created directory: ${out.fileDestDir}`)
						resolve()
					} else exit()
				})
			} else resolve()
		})
	})
	.then(() => {
		return new Promise<void>((resolve) => {
			if (pathExists) {
				stdinPrompt(`File ${out.fullPath} exist. Override it? [Y/n]: `).then((answer) => {
					if (answer.match(/y(es)?/i) || answer === "") resolve()
					else exit()
				})
			} else resolve()
		})
	})
	.then(() => {
		console.log(`Fetching avatar for ID: ${out.id} (extension: ${out.fileExt})`)
		return explicitMemoFetchUserObject(
			out.id,
			undefined,
			out.fileExt as AvatarExtension,
		)().then((data) => {
			return new Promise<string | Uint8Array>((resolve) => {
				if ("key" in data) {
					if (data.key === "fethingUser") resolve("Error while fething user")
					else if (data.key === "fethingAvatar") resolve("Error while fething avatar")
					else resolve("User don't have any avatar")
				} else {
					resolve(data)
				}
			})
		})
	})
	.then((data) => {
		if (typeof data === "string") {
			console.log(data)
			exit(0)
		} else return Bun.write(out.fullPath, data)
	})
	.then(() => {
		console.log(`Successfully fethced avatar for ID: ${out.id},\nand saved in: ${out.fullPath}`)
	})
