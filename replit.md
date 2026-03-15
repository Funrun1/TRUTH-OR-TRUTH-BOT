# Truth or Truth — Discord Bot

An AI-powered Truth or Truth Discord bot that generates unique questions using Groq AI.

## Architecture

- **Runtime**: Node.js 20
- **Entry point**: `bot.js`
- **Package manager**: npm

## Dependencies

- `discord.js` ^14 — Discord API client
- `groq-sdk` ^0.3.3 — Groq AI API client
- `dotenv` ^16 — Environment variable loading

## Required Secrets

| Secret | Description |
|--------|-------------|
| `DISCORD_TOKEN` | Discord bot token (Bot tab in Developer Portal) |
| `CLIENT_ID` | Discord Application ID (General Information) |
| `GROQ_API_KEY` | Groq API key (console.groq.com/keys) |

## Bot Commands

| Command | Description |
|---------|-------------|
| `/truth` | Get an AI-generated truth question (choose a vibe) |
| `/tot` | Truth or Truth — AI picks a random question |

**Vibe options:** Fun & clean · Spicy · Deep · Random

## Workflow

- **Start application** — runs `node bot.js` (console output, no port)

## Notes

- Slash commands may take up to 1 hour to propagate globally after first run
- Uses Groq's `llama-3.3-70b-versatile` model for question generation
