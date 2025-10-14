<template>
  <div class="space-y-8">
    <!-- Приветствие -->
    <div class="text-center animate-fade-in">
      <h1
        class="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent"
      >
        Добро пожаловать в Тюрягу, {{ user?.nickname }}!
      </h1>
      <p class="text-gray-400 text-lg">
        Уровень {{ user?.level }} • {{ formatMoney(user?.money) }} денег •
        {{ user?.respect }} уважения
      </p>
      <div class="mt-4 flex justify-center space-x-4">
        <div
          class="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg"
        >
          <span class="text-yellow-400">⚡</span>
          <span class="text-white">{{ user?.energy || 0 }}/100</span>
        </div>
        <div
          class="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg"
        >
          <span class="text-green-400">💰</span>
          <span class="text-white">{{ formatMoney(user?.money || 0) }}</span>
        </div>
        <div
          class="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg"
        >
          <span class="text-purple-400">👑</span>
          <span class="text-white">{{ user?.respect || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Боссы -->
      <div
        class="card hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl border-l-4 border-red-500"
        @click="navigateTo('/bosses')"
      >
        <div class="text-center">
          <div class="text-5xl mb-3 animate-pulse">👹</div>
          <h3 class="text-xl font-bold text-red-400 mb-2">Боссы</h3>
          <p class="text-gray-400 text-sm mb-3">
            Сражайтесь с боссами и получайте награды
          </p>
          <div class="text-xs text-gray-500">
            {{ activeBosses.length }} активных боссов
          </div>
        </div>
      </div>

      <!-- Братва -->
      <div
        class="card hover:bg-gray-750 transition-colors cursor-pointer"
        @click="navigateTo('/clans')"
      >
        <div class="text-center">
          <div class="text-4xl mb-3">🏴</div>
          <h3 class="text-xl font-bold text-blue-400 mb-2">Братва</h3>
          <p class="text-gray-400 text-sm">
            Создайте или присоединитесь к клану
          </p>
        </div>
      </div>

      <!-- Магазин -->
      <div
        class="card hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl border-l-4 border-yellow-500"
        @click="navigateTo('/shop')"
      >
        <div class="text-center">
          <div class="text-5xl mb-3 animate-bounce">🛒</div>
          <h3 class="text-xl font-bold text-yellow-400 mb-2">Магазин</h3>
          <p class="text-gray-400 text-sm mb-3">
            Покупайте оружие, броню и расходники
          </p>
          <div class="text-xs text-gray-500">
            {{ formatMoney(user?.money || 0) }} 💰
          </div>
        </div>
      </div>

      <!-- Профиль -->
      <div
        class="card hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl border-l-4 border-green-500"
        @click="navigateTo('/profile')"
      >
        <div class="text-center">
          <div class="text-5xl mb-3 animate-spin">👤</div>
          <h3 class="text-xl font-bold text-green-400 mb-2">Профиль</h3>
          <p class="text-gray-400 text-sm mb-3">
            Посмотрите свои характеристики
          </p>
          <div class="text-xs text-gray-500">
            Уровень {{ user?.level || 1 }}
          </div>
        </div>
      </div>
    </div>

    <!-- Статистика -->
    <div class="card">
      <h2 class="text-xl font-bold text-white mb-4">Ваша статистика</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-400">
            {{ user?.level || 0 }}
          </div>
          <div class="text-sm text-gray-400">Уровень</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-400">
            {{ formatMoney(user?.money || 0) }}
          </div>
          <div class="text-sm text-gray-400">Деньги</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-400">
            {{ user?.respect || 0 }}
          </div>
          <div class="text-sm text-gray-400">Уважение</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-400">
            {{ user?.energy || 0 }}
          </div>
          <div class="text-sm text-gray-400">Энергия</div>
        </div>
      </div>
    </div>

    <!-- Активные боссы -->
    <div class="card">
      <h2 class="text-xl font-bold text-white mb-4">Активные боссы</h2>
      <div
        v-if="activeBosses.length === 0"
        class="text-center text-gray-400 py-8"
      >
        <div class="text-4xl mb-2">😴</div>
        <p>Сейчас нет активных боссов</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="boss in activeBosses"
          :key="boss.id"
          class="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
          @click="navigateTo(`/bosses/${boss.id}`)"
        >
          <div class="flex items-center space-x-3">
            <div class="text-2xl">👹</div>
            <div>
              <div class="font-bold text-white">{{ boss.name }}</div>
              <div class="text-sm text-gray-400">Уровень {{ boss.level }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-red-400">
              {{ boss.currentHp }}/{{ boss.maxHp }} HP
            </div>
            <div class="w-20 bg-gray-600 rounded-full h-2 mt-1">
              <div
                class="bg-red-500 h-2 rounded-full"
                :style="{ width: `${(boss.currentHp / boss.maxHp) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const activeBosses = ref([]);

const formatMoney = amount => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};

// Загружаем активных боссов
const loadActiveBosses = async () => {
  try {
    const config = useRuntimeConfig();
    const authStore = useAuthStore();

    const response = await $fetch(`${config.public.apiBase}/api/boss`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });

    if (response.ok) {
      activeBosses.value = response.data.bosses.filter(
        boss => boss.state === 'active'
      );
    }
  } catch (error) {
    console.error('Ошибка загрузки боссов:', error);
  }
};

onMounted(() => {
  loadActiveBosses();
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: 'auth'
});
</script>
