<template>
  <div class="space-y-6">
    <!-- Навигация -->
    <PageNavigation :breadcrumbs="[{ label: 'Боссы' }]" />
    <div class="text-center">
      <h1 class="text-3xl font-bold text-white mb-2">👹 Боссы</h1>
      <p class="text-gray-400">Сражайтесь с боссами и получайте награды</p>
    </div>

    <!-- Фильтры -->
    <div class="card">
      <div class="flex items-center space-x-4">
        <button
          @click="loadBosses"
          class="px-3 py-1 rounded text-sm transition-colors bg-green-600 text-white hover:bg-green-700"
          title="Обновить список боссов"
        >
          🔄 Обновить
        </button>
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
          @click="filter = 'available'"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            filter === 'available'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          Доступны
        </button>
        <button
          @click="filter = 'in_battle'"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            filter === 'in_battle'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          В бою
        </button>
        <button
          @click="filter = 'dead'"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            filter === 'dead'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          Побеждены
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
          'border-l-4 border-green-500': boss.state === 'available',
          'border-l-4 border-orange-500': boss.state === 'in_battle',
          'border-l-4 border-red-500': boss.state === 'dead'
        }"
        @click="navigateTo(`/bosses/${boss.id}`)"
      >
        <div class="text-center">
          <div
            class="text-5xl mb-3"
            :class="{
              'animate-pulse': boss.state === 'active',
              'animate-bounce': boss.state === 'idle',
              'animate-spin': boss.state === 'dead'
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
                'bg-green-600 text-white': boss.state === 'available',
                'bg-orange-600 text-white': boss.state === 'in_battle',
                'bg-red-600 text-white': boss.state === 'dead'
              }"
            >
              {{ getStatusText(boss) }}
            </span>
          </div>

          <!-- HP бар -->
          <div
            v-if="boss.state === 'available' || boss.state === 'in_battle'"
            class="mb-3"
          >
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
const filter = ref('all');

const filteredBosses = computed(() => {
  if (filter.value === 'all') {
    return bosses.value;
  }
  if (filter.value === 'available') {
    return bosses.value.filter(boss => boss.state === 'available');
  }
  if (filter.value === 'in_battle') {
    return bosses.value.filter(boss => boss.state === 'in_battle');
  }
  if (filter.value === 'dead') {
    return bosses.value.filter(boss => boss.state === 'dead');
  }
  return bosses.value;
});

const getStatusText = boss => {
  console.log(`🔍 Получение статуса для босса ${boss.name}:`, boss.state);
  switch (boss.state) {
    case 'available':
      return 'Доступен';
    case 'in_battle':
      return 'В бою';
    case 'dead':
      return 'Побежден';
    default:
      return 'Неизвестно';
  }
};

const formatMoney = amount => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};

// Загружаем список боссов
const loadBosses = async () => {
  try {
    const config = useRuntimeConfig();
    const authStore = useAuthStore();

    console.log('🔄 Принудительная перезагрузка боссов...');
    console.log('🧹 Очищаем кэш...');

    // Очищаем кэш и принудительно обновляем данные
    const response = await $fetch(`${config.public.apiBase}/api/boss`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      },
      // Принудительно обновляем данные
      cache: 'no-cache',
      // Добавляем timestamp для предотвращения кэширования
      query: {
        _t: Date.now()
      }
    });

    console.log('📡 Ответ API боссов:', response);

    if (response.ok) {
      // Принудительно очищаем старые данные
      bosses.value = [];

      // Устанавливаем новые данные
      bosses.value = response.data.bosses;
      console.log('👹 Загруженные боссы:', bosses.value);

      // Проверяем состояния каждого босса
      bosses.value.forEach(boss => {
        console.log(
          `   ${boss.name}: state="${boss.state}", HP=${boss.currentHp}/${boss.maxHp}, participants=${boss.participantCount}`
        );
      });
    }
  } catch (error) {
    console.error('Ошибка загрузки боссов:', error);
  }
};

onMounted(() => {
  loadBosses();

  // Обновляем данные при возвращении на вкладку
  window.addEventListener('focus', () => {
    console.log('🔄 Окно получило фокус, обновляем данные...');
    loadBosses();
  });
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: 'auth'
});
</script>
