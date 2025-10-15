<template>
  <div class="space-y-6">
    <!-- Навигация -->
    <PageNavigation :breadcrumbs="[{ label: 'Работа' }]" />

    <!-- Заголовок -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-white mb-2">💼 Работа</h1>
      <p class="text-gray-400">
        Зарабатывайте деньги и опыт, выполняя различные работы
      </p>
    </div>

    <!-- Активные работы -->
    <div v-if="activeWorks.length > 0" class="card">
      <h2 class="text-xl font-bold text-white mb-4">🔄 Активные работы</h2>
      <div class="space-y-4">
        <div
          v-for="work in activeWorks"
          :key="work._id"
          class="bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500"
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-bold text-white">{{ work.workId.name }}</h3>
            <span class="text-sm text-gray-400">{{ work.workId.icon }}</span>
          </div>

          <p class="text-gray-300 text-sm mb-3">
            {{ work.workId.description }}
          </p>

          <!-- Прогресс бар -->
          <div class="mb-3">
            <div class="flex justify-between text-sm text-gray-400 mb-1">
              <span>Прогресс</span>
              <span>{{ Math.round(work.progress) }}%</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-3">
              <div
                class="bg-blue-500 h-3 rounded-full transition-all duration-300"
                :style="{ width: `${work.progress}%` }"
              ></div>
            </div>
          </div>

          <!-- Время -->
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-400">
              Осталось: {{ formatTime(work.timeRemaining) }}
            </div>
            <div class="space-x-2">
              <button
                @click="completeWork(work._id)"
                class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                :disabled="work.timeRemaining > 0"
              >
                {{ work.timeRemaining > 0 ? 'Ожидание...' : 'Завершить' }}
              </button>
              <button
                @click="cancelWork(work._id)"
                class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="card">
      <div class="flex items-center space-x-4 mb-4">
        <h3 class="text-lg font-bold text-white">Фильтры</h3>
        <div class="flex space-x-2">
          <button
            @click="filterCategory = 'all'"
            class="px-3 py-1 rounded text-sm transition-colors"
            :class="
              filterCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            "
          >
            Все
          </button>
          <button
            @click="filterCategory = 'manual'"
            class="px-3 py-1 rounded text-sm transition-colors"
            :class="
              filterCategory === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            "
          >
            Физический труд
          </button>
          <button
            @click="filterCategory = 'intellectual'"
            class="px-3 py-1 rounded text-sm transition-colors"
            :class="
              filterCategory === 'intellectual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            "
          >
            Умственный труд
          </button>
          <button
            @click="filterCategory = 'dangerous'"
            class="px-3 py-1 rounded text-sm transition-colors"
            :class="
              filterCategory === 'dangerous'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            "
          >
            Опасные
          </button>
          <button
            @click="filterCategory = 'illegal'"
            class="px-3 py-1 rounded text-sm transition-colors"
            :class="
              filterCategory === 'illegal'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            "
          >
            Незаконные
          </button>
        </div>
      </div>
    </div>

    <!-- Список работ -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="work in filteredWorks"
        :key="work._id"
        class="card transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
        :class="getCategoryBorderClass(work.category)"
      >
        <div class="flex items-center space-x-3 mb-4">
          <div class="text-3xl">{{ work.icon }}</div>
          <div>
            <h3 class="text-lg font-bold text-white">{{ work.name }}</h3>
            <p class="text-gray-400 text-sm">
              {{ getCategoryText(work.category) }}
            </p>
          </div>
        </div>

        <p class="text-gray-300 text-sm mb-4">{{ work.description }}</p>

        <!-- Требования -->
        <div class="mb-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Уровень:</span>
            <span
              :class="
                user?.level >= work.level ? 'text-green-400' : 'text-red-400'
              "
            >
              {{ work.level }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Энергия:</span>
            <span
              :class="
                user?.energy >= work.energyCost
                  ? 'text-green-400'
                  : 'text-red-400'
              "
            >
              {{ work.energyCost }}
            </span>
          </div>
          <div
            v-if="work.requirements?.respect > 0"
            class="flex justify-between text-sm"
          >
            <span class="text-gray-400">Уважение:</span>
            <span
              :class="
                user?.respect >= work.requirements.respect
                  ? 'text-green-400'
                  : 'text-red-400'
              "
            >
              {{ work.requirements.respect }}
            </span>
          </div>
        </div>

        <!-- Награды -->
        <div class="mb-4 p-3 bg-gray-800 rounded-lg">
          <h4 class="text-sm font-bold text-white mb-2">Награды</h4>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">💰 Деньги:</span>
            <span class="text-green-400">{{
              formatMoney(work.moneyReward)
            }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">⭐ Опыт:</span>
            <span class="text-blue-400">{{ work.expReward }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">⏱️ Время:</span>
            <span class="text-yellow-400">{{ formatTime(work.duration) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">🎯 Успех:</span>
            <span class="text-purple-400">{{ work.successRate }}%</span>
          </div>
        </div>

        <!-- Дополнительная информация -->
        <div
          v-if="work.cooldown > 0 || work.failurePenalty"
          class="mb-4 text-xs text-gray-500"
        >
          <div v-if="work.cooldown > 0">
            Кулдаун: {{ formatTime(work.cooldown) }}
          </div>
          <div
            v-if="
              work.failurePenalty?.energyLoss > 0 ||
              work.failurePenalty?.moneyLoss > 0
            "
          >
            Штраф при провале:
            <span v-if="work.failurePenalty.energyLoss > 0"
              >-{{ work.failurePenalty.energyLoss }} энергии</span
            >
            <span v-if="work.failurePenalty.moneyLoss > 0"
              >-{{ formatMoney(work.failurePenalty.moneyLoss) }} денег</span
            >
          </div>
        </div>

        <!-- Кнопка действия -->
        <div class="text-center">
          <button
            v-if="work.isWorking"
            class="w-full px-4 py-2 bg-gray-600 text-gray-300 rounded cursor-not-allowed"
            disabled
          >
            Работаем... ({{ formatTime(work.timeRemaining) }})
          </button>
          <button
            v-else-if="canStartWork(work)"
            @click="startWork(work._id)"
            class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            :disabled="loading"
          >
            {{ loading ? 'Начинаем...' : 'Начать работу' }}
          </button>
          <button
            v-else
            class="w-full px-4 py-2 bg-gray-600 text-gray-300 rounded cursor-not-allowed"
            disabled
          >
            Недоступно
          </button>
        </div>
      </div>
    </div>

    <!-- Сообщение о пустом списке -->
    <div
      v-if="filteredWorks.length === 0"
      class="text-center text-gray-400 py-8"
    >
      <div class="text-4xl mb-4">💼</div>
      <p>Нет доступных работ</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const config = useRuntimeConfig();
const user = computed(() => authStore.user);

const works = ref([]);
const activeWorks = ref([]);
const filterCategory = ref('all');
const loading = ref(false);

// Форматирование времени
const formatTime = seconds => {
  if (seconds < 60) return `${seconds}с`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}м`;
  return `${Math.floor(seconds / 3600)}ч ${Math.floor((seconds % 3600) / 60)}м`;
};

// Форматирование денег
const formatMoney = amount => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};

// Получение текста категории
const getCategoryText = category => {
  const categories = {
    manual: 'Физический труд',
    intellectual: 'Умственный труд',
    dangerous: 'Опасная работа',
    illegal: 'Незаконная деятельность'
  };
  return categories[category] || category;
};

// Получение цвета границы по категории
const getCategoryBorderClass = category => {
  const borders = {
    manual: 'border-l-4 border-blue-500',
    intellectual: 'border-l-4 border-purple-500',
    dangerous: 'border-l-4 border-red-500',
    illegal: 'border-l-4 border-yellow-500'
  };
  return borders[category] || 'border-l-4 border-gray-500';
};

// Фильтрация работ
const filteredWorks = computed(() => {
  let filtered = works.value;

  if (filterCategory.value !== 'all') {
    filtered = filtered.filter(work => work.category === filterCategory.value);
  }

  return filtered;
});

// Проверка возможности начать работу
const canStartWork = work => {
  if (!user.value) return false;
  if (work.isWorking) return false;

  return (
    user.value.level >= work.level &&
    user.value.energy >= work.energyCost &&
    user.value.respect >= (work.requirements?.respect || 0)
  );
};

// Загрузка работ
const loadWorks = async () => {
  try {
    const response = await $fetch(`${config.public.apiBase}/api/work`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });

    if (response.ok) {
      works.value = response.data.works;
    }
  } catch (error) {
    console.error('Ошибка загрузки работ:', error);
  }
};

// Загрузка активных работ
const loadActiveWorks = async () => {
  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/work/user/active`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      activeWorks.value = response.data.activeWorks;
    }
  } catch (error) {
    console.error('Ошибка загрузки активных работ:', error);
  }
};

// Начать работу
const startWork = async workId => {
  if (loading.value) return;

  loading.value = true;
  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/work/${workId}/start`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      alert(response.message);
      await loadWorks();
      await loadActiveWorks();
      await authStore.checkAuth(); // Обновляем данные пользователя
    } else {
      alert(response.error);
    }
  } catch (error) {
    console.error('Ошибка начала работы:', error);
    alert('Ошибка начала работы');
  } finally {
    loading.value = false;
  }
};

// Завершить работу
const completeWork = async sessionId => {
  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/work/session/${sessionId}/complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      alert(response.message);
      if (response.data.leveledUp) {
        alert('🎉 Поздравляем! Вы повысили уровень!');
      }
      await loadWorks();
      await loadActiveWorks();
      await authStore.checkAuth();
    } else {
      alert(response.error);
    }
  } catch (error) {
    console.error('Ошибка завершения работы:', error);
    alert('Ошибка завершения работы');
  }
};

// Отменить работу
const cancelWork = async sessionId => {
  if (
    !confirm(
      'Вы уверены, что хотите отменить работу? Энергия будет возвращена частично.'
    )
  ) {
    return;
  }

  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/work/session/${sessionId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      alert(response.message);
      await loadWorks();
      await loadActiveWorks();
      await authStore.checkAuth();
    } else {
      alert(response.error);
    }
  } catch (error) {
    console.error('Ошибка отмены работы:', error);
    alert('Ошибка отмены работы');
  }
};

// Обновление каждые 5 секунд
let updateInterval;

onMounted(async () => {
  await loadWorks();
  await loadActiveWorks();

  // Обновляем каждые 5 секунд
  updateInterval = setInterval(async () => {
    await loadActiveWorks();
  }, 5000);
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: 'auth'
});
</script>
