const messages = [
  { role: "system", content: "You are an AI assistant." },
  { role: "user", content: "Hello!" },
  { role: "assistant", content: "Hi, how can I help you?" },
  { role: "system", content: "System message." },
  { role: "user", content: "What's the weather?" },
];

const systemPrompt = "You are a helpful chatbot.";

// Always prepend the system prompt from .env
const chatMessages = [
  { role: "system", content: systemPrompt },
  ...messages.filter((m) => m.role !== "system"),
];

console.log(chatMessages);
