[Ver001.000]

# OAuth Provider Setup Guide

## Discord

1. Go to https://discord.com/developers/applications
2. Create New Application
3. Go to OAuth2 → General
4. Add Redirect URL: `https://api.yoursite.com/auth/oauth/discord/callback`
5. Copy Client ID and Client Secret

```bash
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
```

## Google

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add Authorized Redirect URI
4. Copy Client ID and Secret

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## GitHub

1. Go to https://github.com/settings/developers
2. New OAuth App
3. Set Authorization Callback URL
4. Copy Client ID and Secret

```bash
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

## Testing Locally

Use ngrok for local development:
```bash
ngrok http 8000
# Use https URL for callbacks
```
