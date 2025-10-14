<template>
  <div
    class="fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700"
  >
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Информация о пользователе -->
        <div class="flex items-center space-x-6">
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-400">Игрок:</span>
            <span class="font-bold text-yellow-400">{{ user?.nickname }}</span>
            <span class="text-sm text-gray-400">Ур.{{ user?.level }}</span>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Энергия -->
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-400">⚡</span>
              <div class="w-20 bg-gray-700 rounded-full h-2">
                <div
                  class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${user?.energy || 0}%` }"
                ></div>
              </div>
              <span class="text-sm text-blue-400"
                >{{ user?.energy || 0 }}/100</span
              >
            </div>

            <!-- Деньги -->
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-400">💰</span>
              <span class="text-sm text-green-400">{{
                formatMoney(user?.money || 0)
              }}</span>
            </div>

            <!-- Уважение -->
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-400">👑</span>
              <span class="text-sm text-purple-400">{{
                user?.respect || 0
              }}</span>
            </div>
          </div>
        </div>

        <!-- Навигация -->
        <nav class="flex items-center space-x-2">
          <NuxtLink
            to="/"
            class="px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
            :class="{ 'bg-gray-700': $route.path === '/' }"
          >
            🏠 Главная
          </NuxtLink>

          <NuxtLink
            to="/bosses"
            class="px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
            :class="{ 'bg-gray-700': $route.path === '/bosses' }"
          >
            👹 Боссы
          </NuxtLink>

          <NuxtLink
            to="/clans"
            class="px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
            :class="{ 'bg-gray-700': $route.path === '/clans' }"
          >
            🏴 Братва
          </NuxtLink>

          <NuxtLink
            to="/shop"
            class="px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
            :class="{ 'bg-gray-700': $route.path === '/shop' }"
          >
            🛒 Магазин
          </NuxtLink>

          <NuxtLink
            to="/profile"
            class="px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
            :class="{ 'bg-gray-700': $route.path === '/profile' }"
          >
            👤 Профиль
          </NuxtLink>

          <button
            @click="logout"
            class="px-2 py-1 rounded text-xs bg-red-600 hover:bg-red-700 transition-colors"
          >
            Выйти
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const logout = () => {
  authStore.logout();
  navigateTo('/login');
};

const formatMoney = amount => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};
</script>
