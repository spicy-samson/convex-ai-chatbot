<!-- <template>
  <h1 class="text-3xl font-bold text-blue-500">Hello Tailwind!</h1>
  <span v-if="isPending"> Loading... </span>
  <ul v-else>
    <li v-for="todo in data">
      {{ todo.text }} {{ todo.isCompleted ? "☑" : "☐" }}
    </li>
  </ul>
</template>
<script setup lang="ts">
import { useConvexQuery } from "convex-vue";
import { api } from "../convex/_generated/api";

const { data, isPending } = useConvexQuery(api.tasks.get);
</script>

<style scoped>

</style> -->

<template>
  <div class="flex flex-col h-screen bg-gray-100 font-gilroy md:flex-row">
    <!-- Hamburger Button (Mobile Only) -->
    <button
    v-if="!showSidebar"
      class="absolute top-4 left-4 z-40 md:hidden bg-gray-900 text-white p-2 rounded"
      @click="showSidebar = true"
      aria-label="Open sidebar"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>

    <!-- Sidebar -->
    <aside
      :class="[
        'bg-gray-900 text-white flex flex-col md:w-64 h-full md:justify-between md:p-6 transition-transform duration-200 z-30',
        showSidebar
          ? 'fixed inset-0 w-64 p-6'
          : 'fixed -translate-x-full w-64 p-6',
        'md:static md:translate-x-0 md:w-64 md:p-6',
      ]"
      @click.self="showSidebar = false"
    >
      <div>
        <div class="flex items-center justify-between mb-4 md:mb-6">
          <h2 class="text-lg font-bold md:text-2xl">AI Chatbot</h2>
          <!-- Close button (Mobile Only) -->
          <button
            class="md:hidden text-white"
            @click="showSidebar = false"
            aria-label="Close sidebar"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div>
          <h3 class="text-sm font-semibold mb-2 opacity-70">Recent Chats</h3>
          <ul>
            <li
              v-for="chat in dummyChats"
              :key="chat.id"
              class="mb-2 px-3 py-2 rounded hover:bg-gray-800 cursor-pointer transition"
            >
              <span class="truncate block">{{ chat.title }}</span>
              <span class="text-xs opacity-60">{{ chat.time }}</span>
            </li>
          </ul>
        </div>
      </div>
      <button
        class="w-full mt-4 py-2 rounded bg-red-600 hover:bg-red-700 transition text-white font-bold"
        @click="logout"
      >
        Log out
      </button>
    </aside>

    <!-- Overlay for mobile sidebar -->
    <div
      v-if="showSidebar"
      class="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden"
      @click="showSidebar = false"
    ></div>

    <!-- Chat Section -->
    <div class="flex-1 flex flex-col relative bg-white">
      <div
        class="flex-1 overflow-y-auto px-2 py-4 pb-28 md:px-6 md:py-8 md:pb-32"
      >
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="[
            'mb-3 p-3 rounded-lg max-w-[90%] break-words text-sm',
            msg.role === 'user'
              ? 'bg-blue-100 self-end ml-auto'
              : 'bg-gray-100 self-start mr-auto',
            'md:mb-4 md:p-4 md:text-base md:max-w-[70%]',
          ]"
        >
          <strong>{{ msg.role === "user" ? "You" : "AI" }}:</strong>
          {{ msg.content }}
        </div>
      </div>
      <form
        @submit.prevent="sendMessage"
        class="fixed left-0 right-0 bottom-0 bg-gray-100 px-2 py-3 flex gap-2 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] z-10 md:left-64 md:px-6 md:py-4 md:gap-3"
      >
        <input
          v-model="input"
          type="text"
          placeholder="Type your message..."
          autocomplete="off"
          :disabled="loading"
          class="flex-1 p-2 rounded-md border border-gray-300 text-sm outline-none disabled:bg-gray-200 md:p-3 md:text-base"
        />
        <button
          type="submit"
          :disabled="loading || !input.trim()"
          class="px-4 rounded-md border-none bg-emerald-600 text-white font-semibold text-sm transition-colors duration-200 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed md:px-6 md:text-base"
        >
          Send
        </button>
      </form>
    </div>
  </div>
</template>


<script>
export default {
  data() {
    return {
      input: "",
      messages: [],
      loading: false,
      showSidebar: false,
      dummyChats: [
        { id: 1, title: "Project Standup", time: "10:30 AM" },
        { id: 2, title: "Weekend Tasks", time: "Yesterday" },
        { id: 3, title: "Stripe Integration", time: "2 days ago" },
        { id: 4, title: "Cloudflare Workers Q&A", time: "3 days ago" },
        { id: 5, title: "General Discussion", time: "Last week" },
      ],
    };
  },
  methods: {
    async sendMessage() {
      if (!this.input.trim() || this.loading) return;
      const userMsg = { role: "user", content: this.input };
      this.messages.push(userMsg);
      this.input = "";
      this.loading = true;

      try {
        const res = await fetch("http://localhost:3000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: this.messages }),
        });
        const data = await res.json();
        this.messages.push({ role: "assistant", content: data.reply });
      } catch (e) {
        this.messages.push({
          role: "assistant",
          content: "Error: Could not get response.",
        });
      }
      this.loading = false;
    },
    logout() {
      // Dummy logout action
      alert("Logged out!");
    },
  },
};
</script>