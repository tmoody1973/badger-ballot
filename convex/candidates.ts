import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all candidates, optionally filtered by race category
export const list = query({
  args: {
    raceCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.raceCategory) {
      return await ctx.db
        .query("candidates")
        .withIndex("by_raceCategory", (q) =>
          q.eq("raceCategory", args.raceCategory!)
        )
        .collect();
    }
    return await ctx.db.query("candidates").collect();
  },
});

// Get a single candidate by candidateId
export const get = query({
  args: { candidateId: v.string() },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_candidateId", (q) => q.eq("candidateId", args.candidateId))
      .collect();
    return candidates[0] ?? null;
  },
});

// Seed candidate data (run once)
export const seed = mutation({
  args: {
    candidates: v.array(
      v.object({
        candidateId: v.string(),
        name: v.string(),
        party: v.string(),
        office: v.string(),
        currentRole: v.string(),
        type: v.string(),
        raceCategory: v.string(),
        photoUrl: v.optional(v.string()),
        keyFact: v.string(),
        findings: v.number(),
        severity: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const candidate of args.candidates) {
      // Check if already exists
      const existing = await ctx.db
        .query("candidates")
        .withIndex("by_candidateId", (q) =>
          q.eq("candidateId", candidate.candidateId)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, candidate);
      } else {
        await ctx.db.insert("candidates", candidate);
      }
    }
    return { seeded: args.candidates.length };
  },
});
