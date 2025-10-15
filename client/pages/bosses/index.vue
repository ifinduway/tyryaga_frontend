<template>
  <div class="space-y-6">
    <!-- Навигация -->
    <PageNavigation :breadcrumbs="[{ label: 'Боссы' }]" />
    <div class="text-center">
      <h1 class="text-3xl font-bold text-white mb-2">👹 Боссы</h1>
      <p class="text-gray-400">
        Выберите босса и создайте свой инстанс для боя
      </p>
    </div>

    <!-- Активный инстанс (если есть) -->
    <div v-if="activeInstance" class="card border-2 border-orange-500">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-orange-400 mb-2">
            🔥 Активный бой
          </h2>
          <p class="text-white font-bold">
            {{ activeInstance.templateName }}
          </p>
          <p class="text-sm text-gray-400">
            Истекает через: {{ formatTimeRemaining(activeInstance.expiresAt) }}
          </p>
        </div>
        <div class="space-x-3">
          <button
            @click="navigateTo(`/bosses/${activeInstance.id}`)"
            class="btn-primary"
          >
            Продолжить бой
          </button>
          <button @click="cancelInstance" class="btn-secondary">
            Отменить
          </button>
        </div>
      </div>
      <div class="mt-4">
        <div class="flex justify-between text-sm text-gray-400 mb-2">
          <span>HP</span>
          <span>{{ activeInstance.currentHp }}/{{ activeInstance.maxHp }}</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-4">
          <div
            class="bg-red-500 h-4 rounded-full transition-all duration-300"
            :style="{
              width: `${(activeInstance.currentHp / activeInstance.maxHp) * 100}%`
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Вкладки -->
    <div class="card">
      <div class="flex items-center space-x-4">
        <button
          @click="activeTab = 'templates'"
          class="px-4 py-2 rounded text-sm transition-colors font-medium"
          :class="
            activeTab === 'templates'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          👹 Создать бой
        </button>
        <button
          @click="activeTab = 'public'"
          class="px-4 py-2 rounded text-sm transition-colors font-medium"
          :class="
            activeTab === 'public'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          🤝 Присоединиться
        </button>
        <div class="flex-1"></div>
        <button
          @click="loadData"
          class="px-3 py-1 rounded text-sm transition-colors bg-green-600 text-white hover:bg-green-700"
          title="Обновить список"
        >
          🔄 Обновить
        </button>
      </div>
    </div>

    <!-- Фильтры для шаблонов -->
    <div v-if="activeTab === 'templates'" class="card">
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
          @click="filter = 'locked'"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            filter === 'locked'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          Заблокированы
        </button>
      </div>
    </div>

    <!-- Список шаблонов боссов -->
    <div
      v-if="activeTab === 'templates'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="card hover:bg-gray-750 transition-all duration-300 relative"
        :class="{
          'border-l-4 border-green-500': template.isAvailable,
          'border-l-4 border-gray-500 opacity-60': !template.isAvailable,
          'cursor-pointer transform hover:scale-105 hover:shadow-xl':
            template.isAvailable && !activeInstance
        }"
        @click="
          template.isAvailable && !activeInstance
            ? openCreateInstanceModal(template)
            : null
        "
      >
        <!-- Лок иконка для недоступных боссов -->
        <div
          v-if="!template.isAvailable"
          class="absolute top-2 right-2 text-3xl"
        >
          🔒
        </div>

        <div class="text-center">
          <div class="text-5xl mb-3 animate-bounce">👹</div>
          <h3 class="text-xl font-bold text-white mb-2">
            {{ template.name }}
          </h3>
          <p class="text-gray-400 text-sm mb-1">Уровень {{ template.level }}</p>
          <p class="text-gray-400 text-xs mb-3">
            Требуется: {{ template.requiredLevel }} уровень
          </p>

          <!-- Статус доступности -->
          <div class="mb-3">
            <span
              class="px-2 py-1 rounded text-xs font-medium"
              :class="{
                'bg-green-600 text-white': template.isAvailable,
                'bg-gray-600 text-white': !template.isAvailable
              }"
            >
              {{
                template.isAvailable
                  ? 'Доступен'
                  : `Требуется ${template.requiredLevel} уровень`
              }}
            </span>
          </div>

          <!-- HP -->
          <div class="mb-3">
            <div class="flex justify-between text-sm text-gray-400 mb-1">
              <span>HP</span>
              <span>{{ formatNumber(template.maxHp) }}</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div class="bg-red-500 h-2 rounded-full w-full"></div>
            </div>
          </div>

          <!-- Награды -->
          <div class="mt-3 text-sm">
            <div class="text-green-400">
              💰 {{ formatMoney(template.rewards.money) }}
            </div>
            <div class="text-blue-400">⭐ {{ template.rewards.exp }} опыта</div>
          </div>

          <!-- Время на инстанс -->
          <div class="mt-3 text-xs text-gray-400">
            ⏱️ {{ formatDuration(template.instanceDuration) }}
          </div>

          <!-- Статистика -->
          <div class="mt-4 pt-4 border-t border-gray-700">
            <div class="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div>
                <div class="font-bold text-white">
                  {{ template.stats?.totalKills || 0 }}
                </div>
                <div>Убито</div>
              </div>
              <div>
                <div class="font-bold text-white">
                  {{
                    template.stats?.fastestKillTime
                      ? formatTime(template.stats.fastestKillTime)
                      : '-'
                  }}
                </div>
                <div>Рекорд</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Сообщение если нет боссов -->
    <div
      v-if="activeTab === 'templates' && filteredTemplates.length === 0"
      class="text-center text-gray-400 py-12"
    >
      <div class="text-6xl mb-4">😴</div>
      <p class="text-xl">Нет боссов для отображения</p>
    </div>

    <!-- Список доступных инстансов -->
    <div v-if="activeTab === 'public'" class="space-y-6">
      <!-- Публичные инстансы -->
      <div v-if="publicInstances.length > 0">
        <h3 class="text-lg font-bold text-white mb-3">🌍 Публичные бои</h3>
        <div class="space-y-4">
          <div
            v-for="instance in publicInstances"
            :key="instance.id"
            class="card hover:bg-gray-750 transition-all cursor-pointer"
            @click="joinInstance(instance.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="text-4xl">👹</div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-lg font-bold text-white">
                      {{ instance.templateName }}
                    </h3>
                  </div>
                  <p class="text-sm text-gray-400">
                    Владелец: {{ instance.ownerNickname }} (ур.
                    {{ instance.ownerLevel }})
                  </p>
                  <p class="text-xs text-gray-500">
                    Участников: {{ instance.participantCount }}
                  </p>
                </div>
              </div>

              <div class="text-right">
                <div class="text-sm text-gray-400 mb-2">
                  Осталось: {{ formatTimeRemaining(instance.expiresAt) }}
                </div>
                <div class="mb-2">
                  <div class="flex justify-between text-xs text-gray-400 mb-1">
                    <span>HP</span>
                    <span
                      >{{ formatNumber(instance.currentHp) }}/{{
                        formatNumber(instance.maxHp)
                      }}</span
                    >
                  </div>
                  <div class="w-48 bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-red-500 h-2 rounded-full transition-all duration-300"
                      :style="{
                        width: `${(instance.currentHp / instance.maxHp) * 100}%`
                      }"
                    ></div>
                  </div>
                </div>
                <button
                  class="btn-primary btn-sm"
                  @click.stop="joinInstance(instance.id)"
                >
                  Присоединиться
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Приватные инстансы друзей -->
      <div v-if="friendsPrivateInstances.length > 0">
        <h3 class="text-lg font-bold text-white mb-3">
          🔒 Приватные бои друзей
        </h3>
        <div class="space-y-4">
          <div
            v-for="instance in friendsPrivateInstances"
            :key="instance.id"
            class="card hover:bg-gray-750 transition-all cursor-pointer border-l-4 border-purple-500"
            @click="joinInstance(instance.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="text-4xl">👹</div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-lg font-bold text-white">
                      {{ instance.templateName }}
                    </h3>
                    <span
                      class="px-2 py-0.5 bg-purple-600 text-white text-xs rounded"
                      >🔒 Приватный</span
                    >
                  </div>
                  <p class="text-sm text-gray-400">
                    Владелец: {{ instance.ownerNickname }} (ур.
                    {{ instance.ownerLevel }})
                  </p>
                  <p class="text-xs text-gray-500">
                    Участников: {{ instance.participantCount }}
                  </p>
                </div>
              </div>

              <div class="text-right">
                <div class="text-sm text-gray-400 mb-2">
                  Осталось: {{ formatTimeRemaining(instance.expiresAt) }}
                </div>
                <div class="mb-2">
                  <div class="flex justify-between text-xs text-gray-400 mb-1">
                    <span>HP</span>
                    <span
                      >{{ formatNumber(instance.currentHp) }}/{{
                        formatNumber(instance.maxHp)
                      }}</span
                    >
                  </div>
                  <div class="w-48 bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-red-500 h-2 rounded-full transition-all duration-300"
                      :style="{
                        width: `${(instance.currentHp / instance.maxHp) * 100}%`
                      }"
                    ></div>
                  </div>
                </div>
                <button
                  class="btn-primary btn-sm"
                  @click.stop="joinInstance(instance.id)"
                >
                  Присоединиться
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Сообщение если нет доступных инстансов -->
      <div
        v-if="
          publicInstances.length === 0 && friendsPrivateInstances.length === 0
        "
        class="text-center text-gray-400 py-12"
      >
        <div class="text-6xl mb-4">🤝</div>
        <p class="text-xl">Нет доступных боев</p>
        <p class="text-sm mt-2">
          Создайте свой бой или дождитесь других игроков
        </p>
      </div>
    </div>

    <!-- Модальное окно создания инстанса -->
    <div
      v-if="showCreateInstanceModal"
      class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      @click.self="closeCreateInstanceModal"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-white mb-4">
          👹 Создать бой: {{ selectedTemplate?.name }}
        </h3>

        <div class="mb-6">
          <label class="flex items-center space-x-3 cursor-pointer">
            <input
              v-model="isPrivateInstance"
              type="checkbox"
              class="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
            <span class="text-white">
              <span class="font-bold">🔒 Приватный бой</span>
              <span class="block text-sm text-gray-400 mt-1">
                Только приглашенные друзья смогут присоединиться
              </span>
            </span>
          </label>
        </div>

        <div class="flex gap-3">
          <button
            @click="closeCreateInstanceModal"
            class="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
          >
            Отмена
          </button>
          <button
            @click="confirmCreateInstance"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth';

const { $pinia } = useNuxtApp();
const authStore = useAuthStore($pinia);
const config = useRuntimeConfig();

const templates = ref([]);
const activeInstance = ref(null);
const publicInstances = ref([]);
const friendsPrivateInstances = ref([]);
const filter = ref('all');
const activeTab = ref('templates');
const showCreateInstanceModal = ref(false);
const selectedTemplate = ref(null);
const isPrivateInstance = ref(false);

const filteredTemplates = computed(() => {
  if (filter.value === 'all') {
    return templates.value;
  }
  if (filter.value === 'available') {
    return templates.value.filter(t => t.isAvailable);
  }
  if (filter.value === 'locked') {
    return templates.value.filter(t => !t.isAvailable);
  }
  return templates.value;
});

const formatMoney = amount => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};

const formatNumber = num => {
  return new Intl.NumberFormat('ru-RU').format(num);
};

const formatDuration = ms => {
  const minutes = Math.floor(ms / 60000);
  return `${minutes} минут`;
};

const formatTime = ms => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatTimeRemaining = expiresAt => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;

  if (diff <= 0) return 'Истекло';

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Загрузка шаблонов боссов
const loadTemplates = async () => {
  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/boss/template`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      templates.value = response.data.templates;
      console.log('📋 Загружены шаблоны боссов:', templates.value.length);
    }
  } catch (error) {
    console.error('Ошибка загрузки шаблонов боссов:', error);
  }
};

// Загрузка активного инстанса
const loadActiveInstance = async () => {
  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/boss/instance/active`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      activeInstance.value = response.data.instance;
      console.log('🔥 Активный инстанс:', activeInstance.value);
    }
  } catch (error) {
    console.error('Ошибка загрузки активного инстанса:', error);
  }
};

// Загрузка доступных инстансов других игроков
const loadAvailableInstances = async () => {
  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/boss/instance/available`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      publicInstances.value = response.data.publicInstances || [];
      friendsPrivateInstances.value =
        response.data.friendsPrivateInstances || [];
      console.log(
        '🤝 Загружены инстансы:',
        `${publicInstances.value.length} публичных,`,
        `${friendsPrivateInstances.value.length} приватных`
      );
    }
  } catch (error) {
    console.error('Ошибка загрузки доступных инстансов:', error);
  }
};

// Присоединение к инстансу
const joinInstance = async instanceId => {
  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/boss/instance/${instanceId}/join`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      console.log('✅ Присоединились к инстансу:', response.data.instance);
      // Переходим на страницу инстанса
      navigateTo(`/bosses/${instanceId}`);
    }
  } catch (error) {
    console.error('Ошибка присоединения к инстансу:', error);
    if (error.data?.error) {
      alert(error.data.error);
    }
  }
};

// Загрузка всех данных
const loadData = async () => {
  await Promise.all([
    loadTemplates(),
    loadActiveInstance(),
    loadAvailableInstances()
  ]);
};

// Открыть модальное окно создания инстанса
const openCreateInstanceModal = template => {
  selectedTemplate.value = template;
  isPrivateInstance.value = false;
  showCreateInstanceModal.value = true;
};

// Закрыть модальное окно создания инстанса
const closeCreateInstanceModal = () => {
  showCreateInstanceModal.value = false;
  selectedTemplate.value = null;
  isPrivateInstance.value = false;
};

// Подтвердить создание инстанса
const confirmCreateInstance = async () => {
  if (!selectedTemplate.value) return;

  await createInstance(selectedTemplate.value.id, isPrivateInstance.value);
  closeCreateInstanceModal();
};

// Создание инстанса
const createInstance = async (templateId, isPrivate = false) => {
  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/boss/instance/create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        },
        body: {
          templateId,
          isPrivate
        }
      }
    );

    if (response.ok) {
      console.log(
        '✅ Инстанс создан:',
        response.data.instance,
        isPrivate ? '(приватный)' : '(публичный)'
      );
      // Переходим на страницу инстанса
      navigateTo(`/bosses/${response.data.instance.id}`);
    }
  } catch (error) {
    console.error('Ошибка создания инстанса:', error);
    if (error.data?.error) {
      alert(error.data.error);
    }
  }
};

// Отмена инстанса
const cancelInstance = async () => {
  if (!confirm('Вы уверены, что хотите отменить текущий бой?')) {
    return;
  }

  try {
    await $fetch(
      `${config.public.apiBase}/api/boss/instance/${activeInstance.value.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    activeInstance.value = null;
    await loadData();
  } catch (error) {
    console.error('Ошибка отмены инстанса:', error);
  }
};

// Обновление таймера каждую секунду
let timerInterval = null;

onMounted(async () => {
  await loadData();

  // Обновляем таймер каждую секунду
  timerInterval = setInterval(() => {
    if (activeInstance.value) {
      const now = new Date();
      const expires = new Date(activeInstance.value.expiresAt);
      if (now >= expires) {
        // Инстанс истек
        activeInstance.value = null;
        loadData();
      }
    }
  }, 1000);

  // Обновляем данные при возвращении на вкладку
  window.addEventListener('focus', loadData);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  window.removeEventListener('focus', loadData);
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: 'auth'
});
</script>
