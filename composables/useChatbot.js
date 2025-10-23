import { ref, watch } from "vue";
import { useConvexQuery, useConvexMutation } from "convex-vue";
import { api } from "../convex/_generated/api";

export function useChatbot(userId = "guest") {
  const input = ref("");
  const loading = ref(false);
  const conversationId = ref(null);

  const { data: conversations } = useConvexQuery(
    api.conversations.getConversations,
    { user_id: userId }
  );
  const { mutate: sendMessageConvex } = useConvexMutation(
    api.messages.sendMessage
  );
  const { mutate: createConversation } = useConvexMutation(
    api.conversations.createConversation
  );
  const { data: messages } = useConvexQuery(api.messages.getMessages, () =>
    conversationId.value ? { conversation_id: conversationId.value } : undefined
  );
  const { mutate: deleteConversation } = useConvexMutation(
    api.conversations.deleteConversation
  );
  const { mutate: updateConversationTitle } = useConvexMutation(
    api.conversations.updateConversationTitle
  );

  watch(conversations, async (newVal) => {
    if (newVal && newVal.length > 0 && !conversationId.value) {
      conversationId.value = newVal[0]._id;
    } else if (!newVal || newVal.length === 0) {
      const newConv = await createConversation({ user_id: userId });
      conversationId.value = newConv._id;
    }
  });

  async function ensureConversation() {
    if (conversationId.value) return;
    if (conversations && conversations.length > 0) {
      conversationId.value = conversations[0]._id;
    } else {
      const newConv = await createConversation({ user_id: userId });
      conversationId.value = newConv._id;
    }
  }

  async function sendMessage() {
    if (!input.value.trim() || loading.value) return;
    await ensureConversation();
    const userInput = input.value;
    input.value = "";
    await sendMessageConvex({
      conversation_id: conversationId.value,
      role: "user",
      content: userInput,
    });
    loading.value = true;
    setTimeout(async () => {
      try {
        const safeMessages = Array.isArray(messages) ? messages : [];
        const history = safeMessages.concat({
          role: "user",
          content: userInput,
        });
        const res = await fetch("http://localhost:3000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationId.value,
            messages: history,
          }),
        });
        const data = await res.json();
        await sendMessageConvex({
          conversation_id: conversationId.value,
          role: "assistant",
          content: data.reply,
        });
        
        // If a title was generated, update it in the database
        if (data.title && conversationId.value) {
          console.log("Updating conversation title from frontend:", data.title);
          await updateConversationTitle({
            conversationId: conversationId.value,
            title: data.title
          });
        }
      } catch (e) {
        console.error("Error in sendMessage:", e);
        await sendMessageConvex({
          conversation_id: conversationId.value,
          role: "assistant",
          content: "Error: Could not get response. (from frontend)",
        });
      }
      loading.value = false;
    }, 1200);
  }

  async function handleNewChat() {
    const newConv = await createConversation({ user_id: userId });
    if (newConv && newConv._id) {
      conversationId.value = newConv._id;
      input.value = "";
    }
  }

  async function deleteConversationById(convId) {
    if (!convId) return;
    await deleteConversation({ conversationId: convId });
    if (conversations && conversations.length > 0) {
      // Optionally update conversationId here
    } else {
      conversationId.value = null;
    }
  }

  function logout() {
    alert("Logged out!");
  }

  return {
    input,
    loading,
    conversationId,
    conversations,
    messages,
    sendMessage,
    handleNewChat,
    deleteConversationById,
    logout,
  };
}
