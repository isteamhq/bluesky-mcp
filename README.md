# @isteam/bluesky-mcp

[![npm version](https://img.shields.io/npm/v/@isteam/bluesky-mcp.svg)](https://www.npmjs.com/package/@isteam/bluesky-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

MCP server for Bluesky / AT Protocol — search, post, reply, like, and follow via AI agents.

Built by [is.team](https://is.team) — the AI-native project management platform.

## Quick Start

Add to your MCP config (`.mcp.json` for Claude Code, or Claude Desktop settings):

```json
{
  "mcpServers": {
    "bluesky": {
      "command": "npx",
      "args": ["-y", "@isteam/bluesky-mcp"],
      "env": {
        "BLUESKY_IDENTIFIER": "your-handle.bsky.social",
        "BLUESKY_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

## Tools (15)

### Search & Discovery

| Tool | Description |
|------|-------------|
| `search_posts` | Search posts by keywords, hashtags, or phrases |
| `search_users` | Search users by name or handle |
| `get_user_feed` | Get a user's recent posts |
| `get_timeline` | Get your home timeline |

### Engagement

| Tool | Description |
|------|-------------|
| `create_post` | Create a new post (max 300 characters, auto-detects links and mentions) |
| `reply_post` | Reply to a post |
| `delete_post` | Delete a post by AT URI |
| `like_post` | Like a post |
| `repost` | Repost a post |
| `follow_user` | Follow a user by handle |

### Profile & Info

| Tool | Description |
|------|-------------|
| `get_profile` | Get a user's profile (or your own) |
| `get_post` | Get a specific post with metrics |
| `get_thread` | Get a full post thread with replies |
| `get_notifications` | Get recent notifications (likes, replies, follows, mentions) |
| `update_profile` | Update your display name or bio |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BLUESKY_IDENTIFIER` | Yes | Your Bluesky handle (e.g. `you.bsky.social`) |
| `BLUESKY_APP_PASSWORD` | Yes | App-specific password |

### Getting your credentials

1. Go to [Bluesky Settings](https://bsky.app/settings) and sign in
2. Navigate to **Privacy and Security** > **App passwords**
3. Create a new app password
4. Use your full handle (e.g. `yourname.bsky.social`) as the identifier

## Usage Examples

**Engage with your community:**
> "Search Bluesky for posts about 'AI project management' and like the most relevant ones"

**Post an update:**
> "Post on Bluesky: We just launched real-time AI collaboration on is.team! Your AI teammates can now join standups."

**Monitor your feed:**
> "Check my Bluesky notifications and reply to any mentions"

## About is.team

[is.team](https://is.team) is an AI-native project management platform where AI agents and humans collaborate as real teammates. AI agents join boards, create tasks, chat, and get work done — just like any other team member.

Part of the [is.team](https://is.team) open-source MCP ecosystem:
- [@isteam/mcp](https://www.npmjs.com/package/@isteam/mcp) — Project management
- [@isteam/google-ads-mcp](https://www.npmjs.com/package/@isteam/google-ads-mcp) — Google Ads
- [@isteam/twitter-mcp](https://www.npmjs.com/package/@isteam/twitter-mcp) — Twitter/X
- [@isteam/bluesky-mcp](https://www.npmjs.com/package/@isteam/bluesky-mcp) — Bluesky
- [@isteam/linkedin-mcp](https://www.npmjs.com/package/@isteam/linkedin-mcp) — LinkedIn

## License

MIT
