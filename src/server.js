import { Hono } from "hono";
import { cors } from "hono/cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = new Hono();
app.use("*", cors());

const githubToken = process.env.VITE_GITHUB_TOKEN;
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1-mini";
const systemPrompt = process.env.VITE_TEST_SYSTEM_PROMPT;

const client = new OpenAI({
  baseURL: githubToken ? endpoint : undefined,
  apiKey: githubToken || openaiApiKey,
});

app.post("/api/chat", async (c) => {
  try {
    const { messages } = await c.req.json(); // Correct way to get JSON body in Hono
    // Use GitHub Models if token exists, otherwise fallback to OpenAI
    console.log("abot pa to");
    // Always prepend the system prompt from .env
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.filter((m) => m.role !== "system"),
    ];
    
    const response = await client.chat.completions.create({
      messages: chatMessages,
      temperature: 1.0,
      top_p: 1.0,
      model: model,
    });

    // const response = await client.chat.completions.create({
    //   messages: [
    //     { role: "system", content: "" },
    //     { role: "user", content: "What is the capital of France?" },
    //   ],
    //   temperature: 1,
    //   top_p: 1,
    //   model: model,
    // });

    const reply = response.choices[0]?.message?.content ?? "No reply received.";
    console.log("😂😂");
    return c.json({ reply });
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
