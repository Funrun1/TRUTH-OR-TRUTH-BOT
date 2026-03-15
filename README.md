# 🤔 Truth or Truth — Discord Bot

An AI-powered Truth or Truth bot for Discord. Every question is unique, generated live by ChatGPT.

---

## Commands

| Command | Description |
|---------|-------------|
| `/truth` | Get an AI truth question (pick a vibe) |
| `/tot` | Truth or Truth — AI picks a random question for you |

**Vibe options:** Fun & clean ·  Deep · Random

---

## Setup (step by step)

### 1. Install Node.js
Download from https://nodejs.org — version 18 or higher.

### 2. Install dependencies
Open a terminal in this folder and run:
```
npm install
```

### 3. Create your Discord Bot
1. Go to https://discord.com/developers/applications
2. Click **New Application** and give it a name (e.g. "Truth or Truth")
3. Go to the **Bot** tab → click **Add Bot**
4. Click **Reset Token** and copy your `DISCORD_TOKEN`
5. Go to **OAuth2 → General** and copy your `CLIENT_ID`
6. To invite it to your server:
   - Go to **OAuth2 → URL Generator**
   - Check `bot` and `applications.commands`
   - Under Bot Permissions check `Send Messages`
   - Open the generated URL and add the bot to your server

### 4. Get an OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click **Create new secret key** and copy it
3. Make sure your account has credits at https://platform.openai.com/usage

### 5. Add your keys

Create a file called `.env` in this folder:
```
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
OPENAI_API_KEY=your_openai_api_key
```

Then install dotenv:
```
npm install dotenv
```

And add this line to the very top of `bot.js`:
```js
require('dotenv').config();
```

### 6. Run the bot
```
node bot.js
```

You should see:
```
Registering slash commands...
Slash commands registered!
✅ Logged in as YourBot#1234
```

Now go to your Discord server and type `/truth` or `/tot` — enjoy! 🎉

---

## Notes
- Slash commands may take up to 1 hour to appear globally after first run
- The bot uses `gpt-4o-mini` which is fast and cheap (fractions of a cent per question)
- You can change the model in `bot.js` to `gpt-4o` for smarter questions
