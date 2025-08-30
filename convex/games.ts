import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export const createGame = mutation({
  args: {
    name: v.string(),
    maxPlayers: v.number(),
    createdBy: v.string(),
    settings: v.object({
      initialChips: v.number(),
      blindInterval: v.number(),
      smallBlind: v.number(),
      bigBlind: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const gameId = await ctx.db.insert("games", {
      name: args.name,
      status: "waiting",
      maxPlayers: args.maxPlayers,
      currentPlayers: 0,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      settings: args.settings,
    });
    
    return gameId;
  },
});

export const listGames = query({
  args: {
    status: v.optional(v.union(v.literal("waiting"), v.literal("active"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("games")
        .withIndex("by_status", (q) => q.eq("status", args.status))
        .collect();
    }
    return await ctx.db.query("games").collect();
  },
});

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const joinGame = mutation({
  args: {
    gameId: v.id("games"),
    userId: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "waiting") throw new Error("Game already started");
    if (game.currentPlayers >= game.maxPlayers) throw new Error("Game is full");
    
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (existingPlayer) throw new Error("Already in this game");
    
    const playerId = await ctx.db.insert("players", {
      gameId: args.gameId,
      userId: args.userId,
      name: args.userName,
      chips: game.settings.initialChips,
      position: game.currentPlayers,
      status: "active",
      currentBet: 0,
      totalBet: 0,
      isDealer: game.currentPlayers === 0,
      isCurrentTurn: false,
      joinedAt: Date.now(),
    });
    
    await ctx.db.patch(args.gameId, {
      currentPlayers: game.currentPlayers + 1,
    });
    
    if (game.currentPlayers + 1 >= 2) {
      await ctx.db.patch(args.gameId, {
        status: "active",
        startedAt: Date.now(),
      });
    }
    
    return playerId;
  },
});

export const startGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "waiting") throw new Error("Game already started");
    if (game.currentPlayers < 2) throw new Error("Not enough players");
    
    await ctx.db.patch(args.gameId, {
      status: "active",
      startedAt: Date.now(),
    });
    
    const roundId = await ctx.db.insert("rounds", {
      gameId: args.gameId,
      roundNumber: 1,
      pot: 0,
      communityCards: [],
      currentBet: game.settings.bigBlind,
      phase: "pre-flop",
      startedAt: Date.now(),
    });
    
    return roundId;
  },
});

export const leaveGame = mutation({
  args: {
    gameId: v.id("games"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    
    const player = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!player) throw new Error("Player not in game");
    
    await ctx.db.patch(player._id, {
      status: "out",
    });
    
    await ctx.db.patch(args.gameId, {
      currentPlayers: Math.max(0, game.currentPlayers - 1),
    });
    
    return { success: true };
  },
});