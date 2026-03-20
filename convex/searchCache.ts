import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Look up cached search results by query hash
export const get = query({
  args: { queryHash: v.string() },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("searchCache")
      .withIndex("by_queryHash", (q) => q.eq("queryHash", args.queryHash))
      .first();

    if (!cached) return null;

    // Check expiry
    if (cached.expiresAt < Date.now()) {
      return null;
    }

    return {
      ...cached,
      results: JSON.parse(cached.results),
    };
  },
});

// Store search results in cache
export const set = mutation({
  args: {
    queryHash: v.string(),
    candidateId: v.string(),
    topic: v.optional(v.string()),
    queryType: v.string(),
    results: v.string(), // JSON stringified
    ttlMs: v.optional(v.number()), // default 1 hour
  },
  handler: async (ctx, args) => {
    const ttl = args.ttlMs ?? 3600000; // 1 hour default

    // Remove existing entry for this hash
    const existing = await ctx.db
      .query("searchCache")
      .withIndex("by_queryHash", (q) => q.eq("queryHash", args.queryHash))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("searchCache", {
      queryHash: args.queryHash,
      candidateId: args.candidateId,
      topic: args.topic,
      queryType: args.queryType,
      results: args.results,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  },
});

// Clear expired cache entries
export const cleanup = mutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("searchCache")
      .collect();

    let cleaned = 0;
    for (const entry of expired) {
      if (entry.expiresAt < Date.now()) {
        await ctx.db.delete(entry._id);
        cleaned++;
      }
    }
    return { cleaned };
  },
});
