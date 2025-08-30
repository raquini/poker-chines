import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
  args: {
    gameId: v.id("games"),
    userId: v.string(),
    userName: v.string(),
    message: v.string(),
    type: v.optional(v.union(v.literal("message"), v.literal("system"), v.literal("action"))),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("chat", {
      gameId: args.gameId,
      userId: args.userId,
      userName: args.userName,
      message: args.message,
      timestamp: Date.now(),
      type: args.type || "message",
    });
    
    return messageId;
  },
});

export const getGameMessages = query({
  args: {
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("chat")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId));
    
    const messages = await query.collect();
    
    const sortedMessages = messages.sort((a, b) => b.timestamp - a.timestamp);
    
    if (args.limit) {
      return sortedMessages.slice(0, args.limit);
    }
    
    return sortedMessages;
  },
});

export const clearGameChat = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chat")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    return { deleted: messages.length };
  },
});