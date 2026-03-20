import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Candidate directory — static data, seeded once
  candidates: defineTable({
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
  }).index("by_candidateId", ["candidateId"])
    .index("by_raceCategory", ["raceCategory"]),

  // Cached Firecrawl search results
  searchCache: defineTable({
    queryHash: v.string(),
    candidateId: v.string(),
    topic: v.optional(v.string()),
    queryType: v.string(), // "pull_receipts" | "deep_dive"
    results: v.string(), // JSON stringified search results
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_queryHash", ["queryHash"])
    .index("by_candidateId", ["candidateId"]),

  // Conversation history
  conversations: defineTable({
    sessionId: v.string(),
    candidateId: v.string(),
    messages: v.array(
      v.object({
        role: v.string(),
        text: v.string(),
        timestamp: v.number(),
      })
    ),
    components: v.array(
      v.object({
        type: v.string(),
        data: v.string(), // JSON stringified component data
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_sessionId", ["sessionId"])
    .index("by_candidateId", ["candidateId"]),

  // Known URLs for demo candidates (targeted scraping in Pass 2)
  knownUrls: defineTable({
    candidateId: v.string(),
    source: v.string(), // "ballotpedia" | "opensecrets" | "congress_gov" | "campaign"
    url: v.string(),
    lastScraped: v.optional(v.number()),
  }).index("by_candidateId", ["candidateId"]),
});
