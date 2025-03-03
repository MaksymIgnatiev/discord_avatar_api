import { config } from "./config"
import { fileExts } from "./db"
import fs from "fs"
var [flag, originalFilename, originalPath] = process.argv.slice(2)
var extJoined = fileExts.join(", ")
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

All actions on files will be asked before performing any actions!`,
	)
	process.exit()
}
if (!originalFilename.match(/^\d+(\.\w{3,5})$/)) {
	console.log(
		`Fetch: ID object needs to be one of: 'XXXXXXXXXXXXXXXXXX' or 'XXXXXXXXXXXXXXXXXX.ext' templates, where 'X' - any digit, 'XXX...' represents discord user id, and '.ext' represents desired file format (one of: ${extJoined}; default: ${config.defaultExtension})`,
	)
	process.exit()
}
var path = originalPath.match(/\.\w+$/)
if (!path) {
	// directory or file with no extension
} else {
	// file
}
