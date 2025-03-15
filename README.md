# Discord avatar API

## How to use:
1. Install [Bun](https://bun.sh)
2. Clone repo:
```sh
git clone https://github.com/MaksymIgnatiev/discord_avatar_api.git
cd discord_avatar_api
```
3. Install dependencies:
```sh
bun i
```
4. Add your own discord bot token to the `.env` file (token can be retrieved very easily on [discord developer portal](https://discord.com/developers/applications) by clicking the `New Application`, after giving the name to the bot, head over to the `Bot` tab, and click `Reset token`. Copy and save it):  
```sh
echo 'DISCORD_API_BOT_TOKEN="your_discord_bot_token"' >> .env
```
Example `.env` file can be found as `.example.env` in the root

5. Run a development server:
```sh
bun dev
```
6. All set up. Go and send GET HTTP request to `http://localhost:7352/{id}` URL to receive a PNG (default extension) avatar for given Discord user ID. You can specify extension with `{id}.{ext}` syntax or by passing as a parameter `?ext={ext}`


## Additional functionality

If you want to make a single request, and save the file to the `./fetched/` directory, or to a custom path - use `fetch` script with needed ID and optional path:
```sh
bun fetch 12345678901234[.ext] [path_to_save]
```
> [!NOTE]
> If the `fetch` script will receive an id or a path without extension, script will default extension to default defined in config (`src/config.ts`). Today it's: `.png`.  

> [!NOTE]
> If the `fetch` script will receive a path to a directory, script will save the file as `{id}.{ext}` in that directory, asking for confirmation to override.  

To see help pages for server and fetch scrips - use `-h`/`--help` flag:
```sh
bun start -h
bun fetch -h
```

Configuration can be done by manualy editing `config` object inside [`src/config.ts`](src/config.ts) file.  


## License

This project is licensed under the 0BSD License - see the [LICENSE](LICENSE) file for details.  
