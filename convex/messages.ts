// convex/messages.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    conversation_id: v.id("conversations"),
    role: v.string(),
    content: v.string(),
  },
  handler: async ({ db }, { conversation_id, role, content }) => {
    await db.insert("messages", {
      conversation_id,
      role,
      content,
      created_at: Date.now(),
    });

    // 2️⃣ Fetch the conversation
    const conversation = await db.get(conversation_id);
    if (!conversation) throw new Error("Conversation not found");

    // 3️⃣ Update the timestamp + increment manually
    await db.patch(conversation_id, {
      updated_at: Date.now(),
      length: (conversation.length ?? 0) + 1,
    });
  },
});

export const getMessages = query({
  args: { conversation_id: v.id("conversations") },
  handler: async ({ db }, { conversation_id }) => {
    return await db
      .query("messages")
      .filter((q) => q.eq(q.field("conversation_id"), conversation_id))
      .order("asc")
      .collect();
  },
});
