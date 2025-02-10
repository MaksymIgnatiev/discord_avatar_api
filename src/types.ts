// add more extensions here
export type AvatarExtensionTuple = ["webp", "png", "gif", "jpeg", "jpg"]
// don't touch this line
export type AvatarExtension = AvatarExtensionTuple[number]

export type NotEmpty<S extends string> = S extends "" ? never : S

export type ExplanationToAPIResponse = {
	key: `fething${"User" | "Avatar"}` | "noAvatar"
	response: Response
}

export type Avatar<
	I extends string = string,
	E extends AvatarExtension = AvatarExtension,
	S extends number = number,
> = {
	data: Uint8Array
	id: I
	modifiedAt: number
	extension: E
	size: S
	toString: () => `Avatar(id: ${I}, size: ${S}, ext: ${E})`
}

/** Cloned interface from `discord.js` dependency as `import type { APIUser } from "discord.js"` */
export type DiscordUser = {
	/** The user's id */
	id: string
	/** The user's username, not unique across the platform */
	username: string
	/** The user's Discord-tag */
	discriminator: string
	/** The user's display name, if it is set. For bots, this is the application name */
	global_name: string | null
	/** The user's avatar hash
	 *
	 * See https://discord.com/developers/docs/reference#image-formatting */
	avatar: string | null
	/** Whether the user belongs to an OAuth2 application */
	bot?: boolean
	/** Whether the user is an Official Discord System user (part of the urgent message system) */
	system?: boolean
	/** Whether the user has two factor enabled on their account */
	mfa_enabled?: boolean
	/** The user's banner hash
	 *
	 * See https://discord.com/developers/docs/reference#image-formatting */
	banner?: string | null
	/** The user's banner color encoded as an integer representation of hexadecimal color code */
	accent_color?: number | null
	/** The user's chosen language option */
	locale?: string
	/** Whether the email on this account has been verified */
	verified?: boolean
	/** The user's email */
	email?: string | null
	/** The flags on a user's account
	 *
	 * See https://discord.com/developers/docs/resources/user#user-object-user-flags */
	flags?: number
	/** The type of Nitro subscription on a user's account
	 *
	 * See https://discord.com/developers/docs/resources/user#user-object-premium-types */
	premium_type?: 0 | 1 | 2 | 3
	/** The public flags on a user's account
	 *
	 * See https://discord.com/developers/docs/resources/user#user-object-user-flags */
	public_flags?: number
	/** The user's avatar decoration hash
	 *
	 * See https://discord.com/developers/docs/reference#image-formatting
	 *
	 * @deprecated Use `avatar_decoration_data` instead */
	avatar_decoration?: string | null
	/** The data for the user's avatar decoration
	 *
	 * See https://discord.com/developers/docs/resources/user#avatar-decoration-data-object */
	avatar_decoration_data?: {
		/** The avatar decoration hash
		 *
		 * See https://discord.com/developers/docs/reference#image-formatting */
		asset: string
		/** The id of the avatar decoration's SKU */
		sku_id: string
	} | null
}

// ----- Cache -----

//                           `${  id  }_${ size }.${AvatarExtension}`
export type AvatarFilename = `${number}_${number}.${AvatarExtension}`
export type CacheMap = Map<string, Avatar[]>
export type Cache = {
	code: {
		/** Set the avatar object in code chache */
		set<I extends string>(id: I, avatar: Avatar): void

		/** Get the avatar objects from code chache, returning array of objects representing different avatar image extensions with avatar objects */
		get<I extends string>(id: I): Avatar[] | undefined
		/** Get the avatar object from code chache, including image extension and size (extension and size need to be passed as pair) */
		get<I extends string, E extends AvatarExtension, S extends number>(
			id: I,
			ext: E,
			size: S,
		): Avatar<E, S> | undefined

		/** Chechs if the collection of avatars is in the cache, providing id */
		has<I extends string>(id: I): boolean
		/** Chechs if the avatar is in the cache, providing id, desired extension and size (extension and size need to be passed as pair) */
		has<I extends string, E extends AvatarExtension, S extends number>(
			id: I,
			ext: E,
			size: S,
		): boolean

		/** Tries to delete the whole collection of avatrars, returning boolean as a result of opperation*/
		delete<I extends string>(id: I): boolean
		/** Tries to delete a specific avatrar in collection, providing id, extension and size (extension and size need to be passed as pair), returning boolean as a result of opperation*/
		delete<I extends string, E extends AvatarExtension, S extends number>(
			id: I,
			ext: E,
			size: S,
		): boolean

		/** Chechs the cache time for the given id, extension and size (extension and size need to be passed as pair), looking for the specific avatar in the collection */
		checkTime<I extends string, E extends AvatarExtension, S extends number>(
			id: I,
			ext: E,
			size: S,
		): boolean
	}
	fs: {
		/** Set the avatar object in code chache */
		set<I extends string>(id: I, avatar: Avatar): void

		/** Get the avatar objects from code chache, returning array of objects representing different avatar image extensions with avatar objects */
		get<I extends string>(id: I): Promise<Avatar[] | undefined>
		/** Get the avatar object from code chache, including image extension and size (extension and size need to be passed as pair) */
		get<I extends string, E extends AvatarExtension, S extends number>(
			id: I,
			ext: E,
			size: S,
		): Promise<Avatar<E, S> | undefined>

		/** Chechs if the collection of avatars is in the cache, providing id */
		has<I extends string>(id: I): boolean
		/** Chechs if the avatar is in the cache, providing id, desired extension and size (extension and size need to be passed as pair) */
		has<I extends string, E extends AvatarExtension, S extends number>(
			id: I,
			ext: E,
			size: S,
		): boolean

		/** Tries to delete all files representing avatrars in the cache directory, returning boolean as a result of opperation */
		delete<I extends string>(id: I): Promise<boolean>
		/** Tries to delete a specific avatrar in the cache directory, providing avatar id and extension, returning boolean as a result of opperation */
		delete<I extends string, E extends AvatarExtension, S extends number>(
			id: I,
			ext: E,
			size: S,
		): Promise<boolean>

		/** Chechs the cache time for the given id and extension, looking for the specific file in the cache directory */
		checkTime<I extends string, E extends AvatarExtension, S extends number>(
			id: I,
			ext: E,
			size: S,
		): boolean

		/** Return a list of all unique ids (or whole filenames, if the parameter is passed) stored in the cache directory (id = \``${number}`\`, filename = \``${number}_${number}.${AvatarExtension}`\`) */
		getIds(): string[]
		getIds(withExt: undefined): string[]
		getIds(withExt?: boolean): string[] | AvatarFilename[]
		getIds(withExt: boolean): string[] | AvatarFilename[]
		getIds(withExt: false): string[]
		getIds(withExt: true): AvatarFilename[]
	}
}

// ----- Config -----

export type Config = {
	/** Absolute path to the root of the project */
	readonly ROOT: string
	defaultExtension: AvatarExtension
	defaultSize: number
	avatarCacheTime: number
	cacheType: "code" | "fs"
	server: {
		host: string
		port: number
	}
}
