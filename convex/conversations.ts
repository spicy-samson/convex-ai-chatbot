import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createConversation = mutation({
  args: { user_id: v.optional(v.string()), title: v.optional(v.string()) },
  handler: async ({ db }, { user_id, title }) => {
    const now = Date.now();
    const conversationId = await db.insert("conversations", {
      user_id,
      title: title ?? "New Chat",
      created_at: now,
      updated_at: now,
    });
    return conversationId;
  },
});

export const getConversations = query({
  args: { user_id: v.optional(v.string()) },
  handler: async ({ db }, { user_id }) => {
    return await db
      .query("conversations")
      .filter(q => (user_id ? q.eq(q.field("user_id"), user_id) : true))
      .order("desc")
      .collect();
  },
});
