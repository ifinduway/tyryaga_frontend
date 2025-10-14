<template>
  <div
    class="fixed bottom-4 right-4 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
  >
    <!-- Заголовок чата -->
    <div class="flex items-center justify-between p-3 border-b border-gray-700">
      <h3 class="font-bold text-white">💬 Глобальный чат</h3>
      <button
        @click="toggleChat"
        class="text-gray-400 hover:text-white transition-colors"
      >
        {{ isOpen ? "−" : "+" }}
      </button>
    </div>

    <!-- Содержимое чата -->
    <div v-if="isOpen" class="h-64 flex flex-col">
      <!-- Сообщения -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-3 space-y-2">
        <div v-for="message in messages" :key="message.id" class="text-sm">
          <div v-if="message.senderId" class="flex items-start space-x-2">
            <span class="text-yellow-400 font-medium"
              >{{ message.senderName }}:</span
            >
            <span class="text-gray-300">{{ message.text }}</span>
          </div>
          <div v-else class="text-center text-gray-500 italic">
            {{ message.text }}
          </div>
        </div>

        <div
          v-if="messages.length === 0"
          class="text-center text-gray-500 py-4"
        >
          Пока нет сообщений
        </div>
      </div>

      <!-- Поле ввода -->
      <div class="p-3 border-t border-gray-700">
        <form @submit.prevent="sendMessage" class="flex space-x-2">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Напишите сообщение..."
            maxlength="500"
            class="flex-1 input-field text-sm"
            :disabled="!socketConnected"
          />
          <button
            type="submit"
            :disabled="!newMessage.trim() || !socketConnected"
            class="btn-primary text-sm px-3 py-2"
          >
            Отправить
          </button>
        </form>

        <div v-if="!socketConnected" class="text-xs text-red-400 mt-1">
          Подключение к серверу...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { io } from "socket.io-client";

const { $pinia } = useNuxtApp();
const authStore = useAuthStore($pinia);

const isOpen = ref(true);
const messages = ref([]);
const newMessage = ref("");
const socketConnected = ref(false);
const messagesContainer = ref(null);

let socket = null;

// Подключение к Socket.io
const connectSocket = () => {
  if (!authStore.token) return;

  socket = io(useRuntimeConfig().public.wsUrl, {
    auth: {
      token: authStore.token,
    },
  });

  socket.on("connect", () => {
    console.log("Подключен к серверу");
    socketConnected.value = true;
  });

  socket.on("disconnect", () => {
    console.log("Отключен от сервера");
    socketConnected.value = false;
  });

  socket.on("chatHistory", (data) => {
    messages.value = data.messages || [];
    scrollToBottom();
  });

  socket.on("newMessage", (message) => {
    messages.value.push(message);
    scrollToBottom();
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
};

// Отправка сообщения
const sendMessage = () => {
  if (!newMessage.value.trim() || !socket) return;

  socket.emit("chatMessage", {
    room: "global",
    text: newMessage.value.trim(),
  });

  newMessage.value = "";
};

// Прокрутка к последнему сообщению
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Переключение видимости чата
const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
  }
};

// Подключение при монтировании
onMounted(() => {
  if (authStore.isAuthenticated) {
    connectSocket();
  }
});

// Отключение при размонтировании
onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});

// Переподключение при изменении токена
watch(
  () => authStore.token,
  (newToken) => {
    if (newToken && !socket) {
      connectSocket();
    } else if (!newToken && socket) {
      socket.disconnect();
      socket = null;
      socketConnected.value = false;
    }
  }
);
</script>
