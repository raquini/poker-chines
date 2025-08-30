import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrUpdateUser = mutation({
  args: {
    externalId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .first();
    
    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email || existingUser.email,
        avatar: args.avatar || existingUser.avatar,
        lastActiveAt: Date.now(),
      });
      return existingUser._id;
    }
    
    const userId = await ctx.db.insert("users", {
      externalId: args.externalId,
      name: args.name,
      email: args.email,
      avatar: args.avatar,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalChipsWon: 0,
        totalChipsLost: 0,
        biggestPot: 0,
        bestHand: undefined,
      },
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });
    
    return userId;
  },
});

export const getUser = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .first();
  },
});

export const updateUserStats = mutation({
  args: {
    userId: v.id("users"),
    stats: v.object({
      gamesPlayed: v.optional(v.number()),
      gamesWon: v.optional(v.number()),
      totalChipsWon: v.optional(v.number()),
      totalChipsLost: v.optional(v.number()),
      biggestPot: v.optional(v.number()),
      bestHand: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const updatedStats = {
      gamesPlayed: args.stats.gamesPlayed ?? user.stats.gamesPlayed,
      gamesWon: args.stats.gamesWon ?? user.stats.gamesWon,
      totalChipsWon: args.stats.totalChipsWon ?? user.stats.totalChipsWon,
      totalChipsLost: args.stats.totalChipsLost ?? user.stats.totalChipsLost,
      biggestPot: args.stats.biggestPot ?? user.stats.biggestPot,
      bestHand: args.stats.bestHand ?? user.stats.bestHand,
    };
    
    await ctx.db.patch(args.userId, {
      stats: updatedStats,
      lastActiveAt: Date.now(),
    });
    
    return { success: true };
  },
});

export const getLeaderboard = query({
  args: {
    metric: v.optional(v.union(
      v.literal("gamesWon"),
      v.literal("totalChipsWon"),
      v.literal("biggestPot")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const metric = args.metric || "gamesWon";
    const limit = args.limit || 10;
    
    const sortedUsers = users.sort((a, b) => {
      const aValue = metric === "biggestPot" ? a.stats.biggestPot : 
                     metric === "totalChipsWon" ? a.stats.totalChipsWon :
                     a.stats.gamesWon;
      const bValue = metric === "biggestPot" ? b.stats.biggestPot :
                     metric === "totalChipsWon" ? b.stats.totalChipsWon :
                     b.stats.gamesWon;
      return bValue - aValue;
    });
    
    return sortedUsers.slice(0, limit).map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      name: user.name,
      avatar: user.avatar,
      value: metric === "biggestPot" ? user.stats.biggestPot :
             metric === "totalChipsWon" ? user.stats.totalChipsWon :
             user.stats.gamesWon,
      metric,
    }));
  },
});