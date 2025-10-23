import { Hono } from "hono";
import { cors } from "hono/cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { ConvexHttpClient } from "convex/browser"; // ✅ add this

dotenv.config();
const app = new Hono();
app.use("*", cors());

const githubToken = process.env.VITE_GITHUB_TOKEN;
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1-mini";
const systemPrompt = process.env.VITE_DSA_SYSTEM_PROMPT;

const client = new OpenAI({
  baseURL: githubToken ? endpoint : undefined,
  apiKey: githubToken || openaiApiKey,
});

// Helper to fetch conversation from Convex
async function fetchConvexConversation(conversationId) {
  const convexUrl = process.env.VITE_CONVEX_URL;

  console.log("conversationId type check:", conversationId);
  try {
    const convex = new ConvexHttpClient(convexUrl);

    // Get conversation details
    const conversation = await convex.query("conversations:getConversation", {
      conversation_id: conversationId,
    });

    // Get message count for this conversation
    const messages = await convex.query("messages:getMessages", {
      conversation_id: conversationId,
    });

    return {
      conversation,
      messageCount: messages?.length || 0
    };
  } catch (error) {
    console.error("fetchConvexConversation error:", error);
    throw new Error("Failed to fetch conversation from Convex.");
  }
}

// Helper to update conversation title
async function updateConversationTitle(conversationId, title) {
  const convexUrl = process.env.VITE_CONVEX_URL;
  
  console.log("=== UPDATE TITLE FUNCTION DEBUG ===");
  console.log("Convex URL:", convexUrl);
  console.log("Conversation ID:", conversationId);
  console.log("Title:", title);
  
  try {
    const convex = new ConvexHttpClient(convexUrl);
    console.log("Calling Convex mutation...");
    
    // Try using the internal API instead
    const result = await convex.mutation("conversations:updateConversationTitle", {
      conversationId,
      title
    });
    
    console.log("Mutation result:", result);
    console.log("Title updated successfully!");
  } catch (error) {
    console.error("Error updating conversation title:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    
    // If the mutation fails, we'll just log it but not fail the entire request
    console.log("Continuing without updating title...");
  }
  console.log("=== END UPDATE TITLE DEBUG ===");
}

app.post("/api/chat", async (c) => {
  try {
    const { messages, conversationId } = await c.req.json();
    console.log("abot pa to");

    console.log("====================================");
    console.log(`Conversation ID: ${conversationId}`);
    console.log("====================================");
    
    // Fetch conversation from Convex
    let messageCount = 0;
    try {
      const { conversation, messageCount: count } = await fetchConvexConversation(conversationId);
      messageCount = count;
      console.log("====================================");
      console.log(`Conversation found: ${!!conversation}, Message count: ${messageCount}`);
      console.log("====================================");
    } catch (err) {
      console.error("Error fetching conversation from Convex:", err);
    }

    console.log(`Message count: ${messageCount}`);

    // Always prepend the system prompt from .env
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.filter((m) => m.role !== "system"),
    ];

    // Only generate a title if this is the first user message
    // Check if there's only one user message in the messages array (excluding system messages)
    const userMessages = messages.filter((m) => m.role === "user");
    let generatedTitle = null;
    
    console.log("=== TITLE GENERATION DEBUG ===");
    console.log("Message count from DB:", messageCount);
    console.log("Messages array length:", messages.length);
    console.log("User messages in array:", userMessages.length);
    console.log("Conversation title check - should generate:", userMessages.length === 1);
    
    if (userMessages.length === 1) {
      const userMsg = userMessages[0];
      console.log("Found first user message:", userMsg?.content?.substring(0, 50) + "...");
      
      if (userMsg) {
        console.log("Generating title for:", userMsg.content);
        generatedTitle = await generateChatTitle(userMsg.content);
        console.log("Generated title:", generatedTitle);
        
        // Title will be updated by the frontend
        console.log("Title generated, will be updated by frontend");
      }
    } else {
      console.log("Skipping title generation - not first user message");
    }
    console.log("=== END TITLE DEBUG ===");

    const response = await client.chat.completions.create({
      messages: chatMessages,
      temperature: 1.0,
      top_p: 1.0,
      model: model,
    });

    const reply = response.choices[0]?.message?.content ?? "No reply received.";
    console.log("😂😂");
    if (generatedTitle) {
      return c.json({ reply, title: generatedTitle });
    } else {
      return c.json({ reply });
    }
  } catch (err) {
    console.error("Error during chat request:", err);
    return c.json({ reply: "Error: Could not get response." }, 500);
  }
});

async function generateChatTitle(userFirstMessage) {
  const prompt = `
You are a helpful title generator. Given this conversation, return a short title (max 6 words) that summarizes it.

Example:
User: How do I connect MongoDB with Vue?
Title: "Connecting Vue to MongoDB"

User: ${userFirstMessage}
Title:
`;
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 20,
  });
  return res.choices[0].message.content.trim();
}

export default app;

// For local dev with Node.js
if (process.env.NODE_ENV !== "production") {
  const { serve } = await import("@hono/node-server");
  const port = process.env.PORT || 3000;
  serve({ fetch: app.fetch, port });
  console.log(`Hono server running on http://localhost:${port}`);
}
