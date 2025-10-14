<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-white mb-2">👤 Профиль</h1>
      <p class="text-gray-400">Ваши характеристики и статистика</p>
    </div>

    <!-- Основная информация -->
    <div class="card">
      <div class="flex items-center space-x-6">
        <div class="text-6xl">👤</div>
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-white mb-2">
            {{ user?.nickname }}
          </h2>
          <p class="text-gray-400 mb-4">{{ user?.email }}</p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-400">
                {{ user?.level }}
              </div>
              <div class="text-sm text-gray-400">Уровень</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-400">
                {{ formatMoney(user?.money) }}
              </div>
              <div class="text-sm text-gray-400">Деньги</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-400">
                {{ user?.respect }}
              </div>
              <div class="text-sm text-gray-400">Уважение</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-400">
                {{ user?.energy }}
              </div>
              <div class="text-sm text-gray-400">Энергия</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Прогресс уровня -->
    <div class="card">
      <h3 class="text-xl font-bold text-white mb-4">📈 Прогресс уровня</h3>

      <div class="space-y-3">
        <div class="flex justify-between text-sm text-gray-400">
          <span>Текущий опыт</span>
          <span>{{ user?.exp || 0 }}</span>
        </div>

        <div class="w-full bg-gray-700 rounded-full h-3">
          <div
            class="bg-blue-500 h-3 rounded-full transition-all duration-500"
            :style="{ width: `${getExpPercentage()}%` }"
          ></div>
        </div>

        <div class="flex justify-between text-sm text-gray-400">
          <span>До следующего уровня</span>
          <span>{{ getExpToNextLevel() }}</span>
        </div>
      </div>
    </div>

    <!-- Инвентарь -->
    <div class="card">
      <h3 class="text-xl font-bold text-white mb-4">🎒 Инвентарь</h3>

      <div
        v-if="user?.items?.length === 0"
        class="text-center text-gray-400 py-8"
      >
        <div class="text-4xl mb-2">🎒</div>
        <p>Инвентарь пуст</p>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="item in user?.items"
          :key="item.itemId"
          class="bg-gray-700 rounded-lg p-3 text-center"
        >
          <div class="text-2xl mb-2">📦</div>
          <div class="text-sm text-white">Предмет</div>
          <div class="text-xs text-gray-400">x{{ item.qty }}</div>
        </div>
      </div>
    </div>

    <!-- Клан -->
    <div class="card">
      <h3 class="text-xl font-bold text-white mb-4">🏴 Клан</h3>

      <div v-if="!user?.clanId" class="text-center text-gray-400 py-8">
        <div class="text-4xl mb-2">🏴</div>
        <p>Вы не состоите в клане</p>
        <NuxtLink to="/clans" class="btn-primary mt-4 inline-block">
          Найти клан
        </NuxtLink>
      </div>

      <div v-else class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-bold text-white">{{ clan?.name }}</div>
            <div class="text-sm text-gray-400">Уровень {{ clan?.level }}</div>
          </div>
          <NuxtLink to="/clans" class="btn-secondary text-sm">
            Перейти к клану
          </NuxtLink>
        </div>

        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-lg font-bold text-blue-400">
              {{ clan?.memberCount }}
            </div>
            <div class="text-xs text-gray-400">Участников</div>
          </div>
          <div>
            <div class="text-lg font-bold text-green-400">
              {{ formatMoney(clan?.bank) }}
            </div>
            <div class="text-xs text-gray-400">Банк</div>
          </div>
          <div>
            <div class="text-lg font-bold text-purple-400">{{ clan?.exp }}</div>
            <div class="text-xs text-gray-400">Опыт клана</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Статистика -->
    <div class="card">
      <h3 class="text-xl font-bold text-white mb-4">📊 Статистика</h3>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-400">
            {{ getDaysPlayed() }}
          </div>
          <div class="text-sm text-gray-400">Дней в игре</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-400">
            {{ user?.online ? "Онлайн" : "Оффлайн" }}
          </div>
          <div class="text-sm text-gray-400">Статус</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-400">
            {{ formatDate(user?.lastSeen) }}
          </div>
          <div class="text-sm text-gray-400">Последний вход</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-400">
            {{ formatDate(user?.createdAt) }}
          </div>
          <div class="text-sm text-gray-400">Дата регистрации</div>
        </div>
      </div>
    </div>

    <!-- Действия -->
    <div class="card">
      <h3 class="text-xl font-bold text-white mb-4">⚙️ Действия</h3>

      <div class="space-y-3">
        <button @click="editProfile" class="btn-secondary w-full">
          Редактировать профиль
        </button>

        <button
          @click="logout"
          class="btn-primary w-full bg-red-600 hover:bg-red-700"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "~/stores/auth";

const { $pinia } = useNuxtApp();
const authStore = useAuthStore($pinia);
const user = computed(() => authStore.user);

const clan = ref(null);

const formatMoney = (amount) => {
  return new Intl.NumberFormat("ru-RU").format(amount);
};

const formatDate = (date) => {
  if (!date) return "Неизвестно";
  return new Date(date).toLocaleDateString("ru-RU");
};

const getExpPercentage = () => {
  if (!user.value) return 0;
  const expToNextLevel = user.value.level * 1000;
  return Math.min(100, (user.value.exp / expToNextLevel) * 100);
};

const getExpToNextLevel = () => {
  if (!user.value) return 0;
  const expToNextLevel = user.value.level * 1000;
  return expToNextLevel - user.value.exp;
};

const getDaysPlayed = () => {
  if (!user.value?.createdAt) return 0;
  return Math.floor(
    (Date.now() - new Date(user.value.createdAt)) / (1000 * 60 * 60 * 24)
  );
};

const editProfile = () => {
  // TODO: Реализовать редактирование профиля
  console.log("Редактирование профиля");
};

const logout = () => {
  authStore.logout();
  navigateTo("/login");
};

// Загружаем информацию о клане
const loadClan = async () => {
  if (!user.value?.clanId) return;

  try {
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.apiBase}/api/clans/${user.value.clanId}`
    );
    if (response.ok) {
      clan.value = response.data.clan;
    }
  } catch (error) {
    console.error("Ошибка загрузки клана:", error);
  }
};

onMounted(() => {
  loadClan();
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: "auth",
});
</script>
