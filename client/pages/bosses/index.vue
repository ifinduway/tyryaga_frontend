<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-white mb-2">👹 Боссы</h1>
      <p class="text-gray-400">Сражайтесь с боссами и получайте награды</p>
    </div>

    <!-- Фильтры -->
    <div class="card">
      <div class="flex items-center space-x-4">
        <button
          @click="filter = 'all'"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            filter === 'all'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          Все
        </button>
        <button
          @click="filter = 'active'"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            filter === 'active'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          Активные
        </button>
        <button
          @click="filter = 'idle'"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            filter === 'idle'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          Неактивные
        </button>
      </div>
    </div>

    <!-- Список боссов -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="boss in filteredBosses"
        :key="boss.id"
        class="card hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl"
        :class="{
          'border-l-4 border-green-500': boss.state === 'active',
          'border-l-4 border-gray-500': boss.state === 'idle',
          'border-l-4 border-red-500': boss.state === 'dead',
        }"
        @click="navigateTo(`/bosses/${boss.id}`)"
      >
        <div class="text-center">
          <div
            class="text-5xl mb-3"
            :class="{
              'animate-pulse': boss.state === 'active',
              'animate-bounce': boss.state === 'idle',
              'animate-spin': boss.state === 'dead',
            }"
          >
            👹
          </div>
          <h3 class="text-xl font-bold text-white mb-2">{{ boss.name }}</h3>
          <p class="text-gray-400 text-sm mb-3">Уровень {{ boss.level }}</p>

          <!-- Статус -->
          <div class="mb-3">
            <span
              class="px-2 py-1 rounded text-xs font-medium"
              :class="{
                'bg-green-600 text-white': boss.state === 'active',
                'bg-gray-600 text-white': boss.state === 'idle',
                'bg-red-600 text-white': boss.state === 'dead',
              }"
            >
              {{ getStatusText(boss.state) }}
            </span>
          </div>

          <!-- HP бар -->
          <div v-if="boss.state === 'active'" class="mb-3">
            <div class="flex justify-between text-sm text-gray-400 mb-1">
              <span>HP</span>
              <span>{{ boss.currentHp }}/{{ boss.maxHp }}</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div
                class="bg-red-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(boss.currentHp / boss.maxHp) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- Участники -->
          <div class="text-sm text-gray-400">
            <span>👥 {{ boss.participantCount }} участников</span>
          </div>

          <!-- Награды -->
          <div class="mt-3 text-sm">
            <div class="text-green-400">
              💰 {{ formatMoney(boss.rewards.money) }}
            </div>
            <div class="text-blue-400">⭐ {{ boss.rewards.exp }} опыта</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Сообщение если нет боссов -->
    <div
      v-if="filteredBosses.length === 0"
      class="text-center text-gray-400 py-12"
    >
      <div class="text-6xl mb-4">😴</div>
      <p class="text-xl">Нет боссов для отображения</p>
    </div>
  </div>
</template>

<script setup>
const bosses = ref([]);
const filter = ref("all");

const filteredBosses = computed(() => {
  if (filter.value === "all") {
    return bosses.value;
  }
  return bosses.value.filter((boss) => boss.state === filter.value);
});

const getStatusText = (state) => {
  switch (state) {
    case "active":
      return "Активен";
    case "idle":
      return "Неактивен";
    case "dead":
      return "Побежден";
    default:
      return "Неизвестно";
  }
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat("ru-RU").format(amount);
};

// Загружаем список боссов
const loadBosses = async () => {
  try {
    const config = useRuntimeConfig();
    const authStore = useAuthStore();

    const response = await $fetch(`${config.public.apiBase}/api/boss`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });

    if (response.ok) {
      bosses.value = response.data.bosses;
    }
  } catch (error) {
    console.error("Ошибка загрузки боссов:", error);
  }
};

onMounted(() => {
  loadBosses();
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: "auth",
});
</script>
