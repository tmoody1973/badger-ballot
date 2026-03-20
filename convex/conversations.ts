import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get conversation by session ID
export const get = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Get all conversations for a candidate
export const listByCandidate = query({
  args: { candidateId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_candidateId", (q) => q.eq("candidateId", args.candidateId))
      .order("desc")
      .collect();
  },
});

// Create a new conversation
export const create = mutation({
  args: {
    sessionId: v.string(),
    candidateId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      sessionId: args.sessionId,
      candidateId: args.candidateId,
      messages: [],
      components: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Add a message to a conversation
export const addMessage = mutation({
  args: {
    sessionId: v.string(),
    role: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!conversation) return null;

    const updatedMessages = [
      ...conversation.messages,
      { role: args.role, text: args.text, timestamp: Date.now() },
    ];

    await ctx.db.patch(conversation._id, {
      messages: updatedMessages,
      updatedAt: Date.now(),
    });

    return conversation._id;
  },
});

// Add a rendered component to a conversation
export const addComponent = mutation({
  args: {
    sessionId: v.string(),
    type: v.string(),
    data: v.string(), // JSON stringified
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!conversation) return null;

    const updatedComponents = [
      ...conversation.components,
      { type: args.type, data: args.data },
    ];

    await ctx.db.patch(conversation._id, {
      components: updatedComponents,
      updatedAt: Date.now(),
    });

    return conversation._id;
  },
});
