import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    name: v.string(),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("completed")),
    maxPlayers: v.number(),
    currentPlayers: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    winner: v.optional(v.string()),
    settings: v.object({
      initialChips: v.number(),
      blindInterval: v.number(),
      smallBlind: v.number(),
      bigBlind: v.number(),
    }),
  }).index("by_status", ["status"]),

  players: defineTable({
    gameId: v.id("games"),
    userId: v.string(),
    name: v.string(),
    chips: v.number(),
    position: v.number(),
    status: v.union(v.literal("active"), v.literal("folded"), v.literal("all-in"), v.literal("out")),
    cards: v.optional(v.array(v.object({
      suit: v.string(),
      rank: v.string(),
      value: v.number(),
    }))),
    currentBet: v.number(),
    totalBet: v.number(),
    isDealer: v.boolean(),
    isCurrentTurn: v.boolean(),
    joinedAt: v.number(),
  }).index("by_game", ["gameId"])
    .index("by_user", ["userId"]),

  rounds: defineTable({
    gameId: v.id("games"),
    roundNumber: v.number(),
    pot: v.number(),
    communityCards: v.array(v.object({
      suit: v.string(),
      rank: v.string(),
      value: v.number(),
    })),
    currentBet: v.number(),
    phase: v.union(v.literal("pre-flop"), v.literal("flop"), v.literal("turn"), v.literal("river"), v.literal("showdown")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    winner: v.optional(v.string()),
    winningHand: v.optional(v.string()),
  }).index("by_game", ["gameId"]),

  actions: defineTable({
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
    timestamp: v.number(),
  }).index("by_game", ["gameId"])
    .index("by_round", ["roundId"])
    .index("by_player", ["playerId"]),

  chat: defineTable({
    gameId: v.id("games"),
    userId: v.string(),
    userName: v.string(),
    message: v.string(),
    timestamp: v.number(),
    type: v.union(v.literal("message"), v.literal("system"), v.literal("action")),
  }).index("by_game", ["gameId"]),

  users: defineTable({
    externalId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    stats: v.object({
      gamesPlayed: v.number(),
      gamesWon: v.number(),
      totalChipsWon: v.number(),
      totalChipsLost: v.number(),
      biggestPot: v.number(),
      bestHand: v.optional(v.string()),
    }),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  }).index("by_external_id", ["externalId"]),
});