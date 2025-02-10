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
bun install
```
4. Add your own discord bot token to the `.env` file (token can be retrieved very easily on [discord developer portal](https://discord.com/developers/applications) by clicking the `New Application`, after giving the name to the bot, head over to the `Bot` tab, and click `Reset token`. Copy and save it):  
```sh
echo 'DISCORD_API_BOT_TOKEN="your_discord_bot_token"' >> .env
```
5. Run as a server:
```sh
bun start
# or to send to the background
nohup bun start &
```

## Additional functionality
If you want to make a single request, and save the file to the `./fetched/` directory, or to a custom path - use `fetch` script with needed ID and optional path:
```sh
bun fetch 12345678901234[.ext] [path_to_save]
```
_Note!_ If the `fetch` script will receave an id or a path without extension, script will default extension to `.png`.  
_Note!_ If the `fetch` script will receave a path to a directory, script will save the file as `{id}.{ext}` in that directory, asking for confirmation to override.  

To see help pages for server and fetch scrip - use `-h`/`--help` flag:
```sh
bun start -h
bun fetch -h
```

## License

This project is licensed under the 0BSD License - see the [LICENSE](LICENSE) file for details.  
