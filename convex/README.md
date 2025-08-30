# Poker Chinês - Convex Backend

This directory contains the Convex backend implementation for the Poker Chinês game.

## Setup Instructions

1. **Initialize Convex Project**
   ```bash
   npx convex dev
   ```
   When prompted:
   - Choose "Create a new project"
   - Enter a project name
   - The deployment URL will be generated

2. **Update Environment Variables**
   After running `convex dev`, copy the deployment URL to `.env.local`:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```

3. **Deploy Functions**
   ```bash
   npm run convex:deploy
   ```

## Schema Overview

### Tables

- **games**: Game sessions with settings and status
- **players**: Players in each game with chips and status
- **rounds**: Game rounds with pot and community cards
- **actions**: Player actions (bet, call, raise, fold, etc.)
- **chat**: In-game chat messages
- **users**: User profiles with statistics

### Key Functions

#### Game Management
- `games.createGame`: Create a new game session
- `games.listGames`: List available games
- `games.joinGame`: Join an existing game
- `games.startGame`: Start a game when ready
- `games.leaveGame`: Leave a game

#### Player Actions
- `players.getGamePlayers`: Get all players in a game
- `players.playerAction`: Execute a player action (bet, call, etc.)
- `players.updatePlayerChips`: Update player chip count
- `players.getPlayerStats`: Get player statistics

#### Chat
- `chat.sendMessage`: Send a chat message
- `chat.getGameMessages`: Get game chat history

#### User Management
- `users.createOrUpdateUser`: Create or update user profile
- `users.getUser`: Get user by external ID
- `users.updateUserStats`: Update user statistics
- `users.getLeaderboard`: Get leaderboard by metric

## Development

To run Convex in development mode:
```bash
npm run dev:convex
```

To deploy to production:
```bash
npm run convex:deploy
```

## Testing

You can test the functions using the Convex dashboard:
```bash
npx convex dashboard
```

Or using the CLI:
```bash
npx convex run games:listGames
```