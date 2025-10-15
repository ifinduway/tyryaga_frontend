<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- HUD (Игровой интерфейс) -->
    <GameHUD v-if="isAuthenticated" />

    <!-- Основной контент -->
    <main
      class="container mx-auto px-4 py-8"
      :class="{ 'pt-20': isAuthenticated }"
    >
      <NuxtPage />
    </main>

    <!-- Глобальный чат -->
    <GlobalChat v-if="isAuthenticated" />

    <!-- Контейнер уведомлений -->
    <NotificationContainer />
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth';
import NotificationContainer from '~/components/organisms/NotificationContainer.vue';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
</script>
