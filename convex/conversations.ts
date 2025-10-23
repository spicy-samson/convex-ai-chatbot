import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createConversation = mutation({
  args: { user_id: v.optional(v.string()), title: v.optional(v.string()) },
  handler: async ({ db }, { user_id, title }) => {
    const now = Date.now();
    const conversationId = await db.insert("conversations", {
      user_id,
      title: title ?? "Untitled",
      created_at: now,
      updated_at: now,
      length: 0,
    });
    return conversationId;
  },
});

export const getConversations = query({
  args: { user_id: v.optional(v.string()) },
  handler: async ({ db }, { user_id }) => {
    return await db
      .query("conversations")
      .filter((q) => (user_id ? q.eq(q.field("user_id"), user_id) : true))
      .order("desc")
      .collect();
  },
});

export const getConversation = query({
  args: { conversation_id: v.id("conversations") },
  handler: async ({ db }, { conversation_id }) => {
    return await db.get(conversation_id);
  },
});


getConversation.isPublic = true;

export const updateConversationTitle = mutation({
  args: { 
    conversationId: v.id("conversations"), 
    title: v.string() 
  },
  handler: async ({ db }, { conversationId, title }) => {
    console.log("=== CONVEX MUTATION DEBUG ===");
    console.log("Updating conversation title:", { conversationId, title });
    
    await db.patch(conversationId, { 
      title,
      updated_at: Date.now()
    });
    
    console.log("Title updated successfully in Convex");
    console.log("=== END CONVEX DEBUG ===");
  },
});

updateConversationTitle.isPublic = true;

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // 1. Find all messages for this conversation
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversation_id"), args.conversationId))
      .collect();

    // 2. Delete each message
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    await ctx.db.delete(args.conversationId);
  },
});
