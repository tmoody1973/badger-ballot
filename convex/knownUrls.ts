import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get known URLs for a candidate
export const get = query({
  args: { candidateId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("knownUrls")
      .withIndex("by_candidateId", (q) => q.eq("candidateId", args.candidateId))
      .collect();
  },
});

// Add or update a known URL
export const upsert = mutation({
  args: {
    candidateId: v.string(),
    source: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("knownUrls")
      .withIndex("by_candidateId", (q) => q.eq("candidateId", args.candidateId))
      .collect();

    const match = existing.find((e) => e.source === args.source);

    if (match) {
      await ctx.db.patch(match._id, { url: args.url });
      return match._id;
    }

    return await ctx.db.insert("knownUrls", {
      candidateId: args.candidateId,
      source: args.source,
      url: args.url,
    });
  },
});

// Seed known URLs for demo candidates
export const seedDemoUrls = mutation({
  args: {
    urls: v.array(
      v.object({
        candidateId: v.string(),
        source: v.string(),
        url: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const entry of args.urls) {
      const existing = await ctx.db
        .query("knownUrls")
        .withIndex("by_candidateId", (q) => q.eq("candidateId", entry.candidateId))
        .collect();

      const match = existing.find((e) => e.source === entry.source);

      if (match) {
        await ctx.db.patch(match._id, { url: entry.url });
      } else {
        await ctx.db.insert("knownUrls", entry);
      }
    }
    return { seeded: args.urls.length };
  },
});
