import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  conversations: defineTable({
    user_id: v.optional(v.string()),
    title: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
    length: v.optional(v.number()),
  }),
  messages: defineTable({
    conversation_id: v.id("conversations"),
    role: v.string(), // "user" or "assistant"
    content: v.string(),
    created_at: v.number(),
    metadata: v.optional(v.any()),
  }),
});
