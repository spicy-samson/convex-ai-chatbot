<template>
  <div class="flex flex-col h-screen bg-gray-100 font-gilroy md:flex-row">
    <!-- Hamburger Button (Mobile Only) -->
    <button
      v-if="!showSidebar"
      class="absolute top-4 left-4 z-40 md:hidden bg-gray-900 text-white p-2 rounded"
      @click="showSidebar = true"
      aria-label="Open sidebar"
    >
      <FlowbiteBarsOutline />
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
          <div class="my-6">
            <h6 class="flex items-center gap-2">
              New chat
              <button
                class="ml-2 p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center"
                @click="handleNewChat"
                aria-label="Start new chat"
                type="button"
              >
                <FlowbiteEditOutline class="w-4 h-4" />
              </button>
            </h6>
          </div>
          <h3 class="text-sm font-semibold mb-2 opacity-70">Recent Chats</h3>
          <span v-if="isPending">Loading...</span>
          <ul v-else>
            <li
              v-for="conv in conversations"
              :key="conv._id"
              :class="[
                'cursor-pointer px-3 py-2 rounded mb-2',
                conv._id === conversationId
                  ? 'bg-blue-100 font-semibold'
                  : 'hover:bg-gray-200',
              ]"
              @click="conversationId = conv._id"
            >
              <div class="flex items-center justify-between">
                <span
                  class="truncate block font-extrabold"
                  :class="
                    conv._id === conversationId ? 'text-black' : 'text-white'
                  "
                  >{{ conv.title }}</span
                >
                <FlowbiteTrashBinSolid
                  v-if="conv._id === conversationId"
                  class="ml-2 text-red-600"
                  @click.stop="deleteConversationById(conv._id)"
                />
              </div>

              <span class="block text-xs text-gray-500">{{
                new Date(conv.created_at).toLocaleString()
              }}</span>
            </li>
          </ul>

          <!-- <span v-if="isPending"> Loading... </span>
          <ul v-else>
            <li v-for="todo in data">
              {{ todo.text }} {{ todo.isCompleted ? "☑" : "☐" }}
            </li>
          </ul> -->
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
        class="flex-1 overflow-y-auto m-8 px-2 py-4 pb-28 md:px-6 md:py-8 md:pb-32"
      >
        <div v-if="messages && messages.length">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            :class="msg.role === 'user' ? 'text-right' : 'text-left'"
            class="mb-4"
          >
            <div
              :class="[
                'inline-block px-4 py-2 rounded',
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900',
              ]"
            >
              {{ msg.content }}
            </div>
          </div>
        </div>
        <div v-else class="text-gray-400 text-center mt-10">
          No messages yet.
        </div>
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
</template>

<script setup>
import {ref} from 'vue';
import { useChatbot } from "../composables/useChatbot.js";
import FlowbiteEditOutline from "../assets/svgs/EditSvg.vue";
import FlowbiteBarsOutline from "../assets/svgs/HamBurger.vue";
import FlowbiteTrashBinSolid from "../assets/svgs/TrashSvg.vue";

const showSidebar = ref(false);

const {
  input,
  loading,
  conversationId,
  conversations,
  messages,
  sendMessage,
  handleNewChat,
  deleteConversationById,
  logout,
} = useChatbot("guest");
</script>
