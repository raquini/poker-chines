import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getGamePlayers = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

export const getPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});

export const updatePlayerChips = mutation({
  args: {
    playerId: v.id("players"),
    chips: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");
    
    await ctx.db.patch(args.playerId, {
      chips: args.chips,
      status: args.chips <= 0 ? "out" : player.status,
    });
    
    return { success: true };
  },
});

export const playerAction = mutation({
  args: {
    gameId: v.id("games"),
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    action: v.union(
      v.literal("bet"),
      v.literal("call"),
      v.literal("raise"),
      v.literal("fold"),
      v.literal("check"),
      v.literal("all-in")
    ),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");
    if (!player.isCurrentTurn) throw new Error("Not your turn");
    
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");
    
    let betAmount = 0;
    let newStatus = player.status;
    let newChips = player.chips;
    
    switch (args.action) {
      case "fold":
        newStatus = "folded";
        break;
      case "check":
        if (round.currentBet > player.currentBet) {
          throw new Error("Cannot check, must call or fold");
        }
        break;
      case "call":
        betAmount = round.currentBet - player.currentBet;
        if (betAmount > player.chips) {
          betAmount = player.chips;
          newStatus = "all-in";
        }
        newChips = player.chips - betAmount;
        break;
      case "bet":
      case "raise":
        if (!args.amount) throw new Error("Amount required for bet/raise");
        betAmount = args.amount;
        if (betAmount > player.chips) {
          betAmount = player.chips;
          newStatus = "all-in";
        }
        newChips = player.chips - betAmount;
        await ctx.db.patch(args.roundId, {
          currentBet: player.currentBet + betAmount,
        });
        break;
      case "all-in":
        betAmount = player.chips;
        newChips = 0;
        newStatus = "all-in";
        if (player.currentBet + betAmount > round.currentBet) {
          await ctx.db.patch(args.roundId, {
            currentBet: player.currentBet + betAmount,
          });
        }
        break;
    }
    
    await ctx.db.patch(args.playerId, {
      chips: newChips,
      currentBet: player.currentBet + betAmount,
      totalBet: player.totalBet + betAmount,
      status: newStatus,
      isCurrentTurn: false,
    });
    
    if (betAmount > 0) {
      await ctx.db.patch(args.roundId, {
        pot: round.pot + betAmount,
      });
    }
    
    const actionId = await ctx.db.insert("actions", {
      gameId: args.gameId,
      roundId: args.roundId,
      playerId: args.playerId,
      action: args.action,
      amount: betAmount > 0 ? betAmount : undefined,
      timestamp: Date.now(),
    });
    
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const currentPosition = player.position;
    const nextPosition = (currentPosition + 1) % players.length;
    const nextPlayer = players.find(p => p.position === nextPosition);
    
    if (nextPlayer) {
      await ctx.db.patch(nextPlayer._id, {
        isCurrentTurn: true,
      });
    }
    
    return actionId;
  },
});

export const getPlayerStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.userId))
      .first();
    
    return user?.stats || {
      gamesPlayed: 0,
      gamesWon: 0,
      totalChipsWon: 0,
      totalChipsLost: 0,
      biggestPot: 0,
      bestHand: null,
    };
  },
});