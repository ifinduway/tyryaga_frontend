<template>
  <div class="space-y-6">
    <!-- Навигация -->
    <PageNavigation
      :breadcrumbs="[
        { label: 'Боссы', to: '/bosses' },
        { label: boss?.name || 'Загрузка...' }
      ]"
    />

    <!-- Информация о боссе -->
    <div class="card">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div
            class="text-6xl"
            :class="{
              'animate-pulse': boss?.state === 'active',
              'animate-bounce': boss?.state === 'idle',
              'animate-spin': boss?.state === 'dead'
            }"
          >
            👹
          </div>
          <div>
            <h1
              class="text-3xl font-bold text-white bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent"
            >
              {{ boss?.name }}
            </h1>
            <p class="text-gray-400">Уровень {{ boss?.level }}</p>
          </div>
        </div>

        <div class="text-right">
          <div class="text-sm text-gray-400 mb-1">Статус</div>
          <span
            class="px-3 py-1 rounded text-sm font-medium"
            :class="{
              'bg-green-600 text-white': boss?.state === 'active',
              'bg-gray-600 text-white': boss?.state === 'idle',
              'bg-red-600 text-white': boss?.state === 'dead'
            }"
          >
            {{ getStatusText(boss?.state) }}
          </span>
        </div>
      </div>

      <!-- HP бар -->
      <div v-if="boss?.state === 'active'" class="mt-6">
        <div class="flex justify-between text-sm text-gray-400 mb-2">
          <span>Здоровье</span>
          <span>{{ boss?.currentHp }}/{{ boss?.maxHp }}</span>
        </div>
        <div
          class="w-full bg-gray-700 rounded-full h-6 relative overflow-hidden"
        >
          <div
            class="bg-gradient-to-r from-red-500 to-red-600 h-6 rounded-full transition-all duration-500 relative"
            :style="{ width: `${(boss?.currentHp / boss?.maxHp) * 100}%` }"
          >
            <div
              class="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-30 animate-pulse"
            ></div>
          </div>
          <div
            class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
          >
            {{ Math.round((boss?.currentHp / boss?.maxHp) * 100) }}%
          </div>
        </div>
      </div>

      <!-- Награды -->
      <div class="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-green-400">
            {{ formatMoney(boss?.rewards.money) }}
          </div>
          <div class="text-sm text-gray-400">Деньги</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-blue-400">
            {{ boss?.rewards.exp }}
          </div>
          <div class="text-sm text-gray-400">Опыт</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-purple-400">
            {{ boss?.rewards.items?.length || 0 }}
          </div>
          <div class="text-sm text-gray-400">Предметы</div>
        </div>
      </div>
    </div>

    <!-- Участники боя -->
    <div class="card">
      <h2 class="text-xl font-bold text-white mb-4">👥 Участники боя</h2>

      <div
        v-if="boss?.participants?.length === 0"
        class="text-center text-gray-400 py-8"
      >
        <div class="text-4xl mb-2">😴</div>
        <p>Пока никто не участвует в бою</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="participant in boss?.participants"
          :key="participant.userId"
          class="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <div class="text-2xl">👤</div>
            <div>
              <div class="font-bold text-white">{{ participant.nickname }}</div>
              <div class="text-sm text-gray-400">
                Уровень {{ participant.level }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-red-400">
              {{ formatDamage(participant.damageDealt) }} урона
            </div>
            <div class="text-xs text-gray-400">
              {{ formatDate(participant.joinedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Действия -->
    <div class="card">
      <h2 class="text-xl font-bold text-white mb-4">⚔️ Действия</h2>

      <div v-if="boss?.state === 'active'" class="space-y-4">
        <!-- Форма нанесения урона -->
        <div class="flex items-center space-x-2">
          <input
            v-model.number="damageAmount"
            type="number"
            min="10"
            :max="maxDamage"
            step="10"
            class="input-field w-32"
            placeholder="Урон"
          />
          <button
            @click="damageAmount = maxDamage"
            class="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors font-bold"
            title="Максимальный урон"
          >
            MAX
          </button>
          <button
            @click="dealDamage"
            :disabled="
              !damageAmount ||
              damageAmount <= 0 ||
              !user?.energy ||
              energyRequired > user?.energy
            "
            class="btn-primary"
          >
            Нанести урон
          </button>
        </div>

        <div class="text-sm text-gray-400 space-y-1">
          <p>⚡ Энергия: {{ formatMoney(user?.energy || 0) }}</p>
          <p>💪 Максимальный урон: {{ formatMoney(maxDamage) }}</p>
          <p>🎯 Бонус уровня: +{{ user?.level * 10 }}%</p>
          <p
            v-if="damageAmount > 0"
            :class="
              energyRequired > user?.energy ? 'text-red-400' : 'text-green-400'
            "
          >
            💥 Урон с учетом уровня:
            {{ Math.floor(damageAmount * (1 + user?.level * 0.1)) }} (требуется
            {{ energyRequired }} энергии)
          </p>
          <p class="text-xs">🔌 Socket: {{ socket ? '✅' : '❌' }}</p>
        </div>

        <div class="mt-4">
          <button
            @click="connectSocket"
            class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            Переподключиться к Socket
          </button>
        </div>
      </div>

      <div
        v-else-if="boss?.state === 'dead'"
        class="text-center text-gray-400 py-8"
      >
        <div class="text-4xl mb-2">💀</div>
        <p>Босс побежден!</p>
        <p class="text-sm">Награды уже распределены</p>
      </div>

      <div v-else class="text-center text-gray-400 py-8">
        <div class="text-4xl mb-2">😴</div>
        <p>Босс неактивен</p>
        <p class="text-sm">Ожидайте активации</p>
      </div>
    </div>

    <!-- Лог боя -->
    <div class="card">
      <h2 class="text-xl font-bold text-white mb-4">📜 Лог боя</h2>

      <div v-if="battleLog.length === 0" class="text-center text-gray-400 py-8">
        <div class="text-4xl mb-2">📝</div>
        <p>Лог боя пуст</p>
      </div>

      <div v-else class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="(log, index) in battleLog"
          :key="index"
          class="text-sm p-2 rounded"
          :class="{
            'bg-gray-700': !log.type,
            'bg-red-900': log.type === 'error',
            'bg-green-900': log.type === 'success'
          }"
        >
          <span class="text-gray-400">{{ formatTime(log.timestamp) }}</span>
          <span
            class="ml-2"
            :class="{
              'text-white': !log.type,
              'text-red-300': log.type === 'error',
              'text-green-300': log.type === 'success'
            }"
          >
            {{ log.message }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { io } from 'socket.io-client';

const { $pinia } = useNuxtApp();
const authStore = useAuthStore($pinia);
const user = computed(() => authStore.user);

const route = useRoute();
const bossId = route.params.id;

const boss = ref(null);
const damageAmount = ref(10);
const battleLog = ref([]);

let socket = null;

// Вычисляемое свойство для максимального урона на основе энергии
const maxDamage = computed(() => {
  if (!user.value?.energy) return 10;
  return user.value.energy * 10; // 1 энергия = 10 урона
});

// Вычисляемое свойство для требуемой энергии
const energyRequired = computed(() => {
  if (!damageAmount.value) return 0;
  return Math.ceil(damageAmount.value / 10);
});

// Следим за изменением энергии и корректируем damageAmount
watch(maxDamage, newMaxDamage => {
  if (damageAmount.value > newMaxDamage) {
    damageAmount.value = Math.max(10, newMaxDamage);
  }
});

// Следим за изменением damageAmount и не даем превысить максимум
watch(damageAmount, newValue => {
  if (newValue > maxDamage.value) {
    damageAmount.value = maxDamage.value;
  }
  if (newValue < 10) {
    damageAmount.value = 10;
  }
});

const getStatusText = state => {
  switch (state) {
    case 'active':
      return 'Активен';
    case 'idle':
      return 'Неактивен';
    case 'dead':
      return 'Побежден';
    default:
      return 'Неизвестно';
  }
};

const formatMoney = amount => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};

const formatDamage = damage => {
  return new Intl.NumberFormat('ru-RU').format(damage);
};

const formatDate = date => {
  if (!date) return 'Недавно';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Недавно';
  return parsedDate.toLocaleString('ru-RU');
};

const formatTime = timestamp => {
  return new Date(timestamp).toLocaleTimeString('ru-RU');
};

// Нанесение урона
const dealDamage = async () => {
  console.log('dealDamage вызвана', {
    socket: !!socket,
    damageAmount: damageAmount.value,
    bossId
  });

  if (!socket) {
    console.error('Socket не подключен');
    battleLog.value.push({
      timestamp: Date.now(),
      message: 'Ошибка: Socket не подключен',
      type: 'error'
    });
    return;
  }

  if (!damageAmount.value || damageAmount.value <= 0) {
    console.error('Неверный урон:', damageAmount.value);
    battleLog.value.push({
      timestamp: Date.now(),
      message: 'Ошибка: Введите корректный урон',
      type: 'error'
    });
    return;
  }

  console.log('Отправляем урон:', { bossId, damage: damageAmount.value });

  const currentDamage = damageAmount.value;

  socket.emit('dealDamage', {
    bossId,
    damage: currentDamage
  });

  // Добавляем в лог
  battleLog.value.push({
    timestamp: Date.now(),
    message: `Вы нанесли ${currentDamage} урона`
  });

  // Не сбрасываем урон - пользователь может захотеть атаковать еще раз с тем же значением
};

// Подключение к Socket.io
const connectSocket = () => {
  if (!authStore.token) {
    console.error('Нет токена аутентификации');
    return;
  }

  console.log('Подключаемся к Socket.io...', useRuntimeConfig().public.wsUrl);

  socket = io(useRuntimeConfig().public.wsUrl, {
    auth: {
      token: authStore.token
    }
  });

  socket.on('connect', () => {
    console.log('✅ Подключен к серверу Socket.io');
    // Присоединяемся к комнате босса
    console.log('Присоединяемся к боссу:', bossId);
    socket.emit('joinBoss', { bossId });
  });

  socket.on('connect_error', error => {
    console.error('❌ Ошибка подключения к Socket.io:', error);
  });

  socket.on('bossState', data => {
    boss.value = { ...boss.value, ...data };
  });

  socket.on('bossUpdate', async data => {
    console.log('📡 Получено обновление босса:', data);

    // Перезагружаем полную информацию о боссе для получения обновленных данных участников
    await loadBoss();

    // Обновляем данные пользователя (энергию) если это наша атака
    const currentUserId =
      authStore.user?._id?.toString() || authStore.user?._id;
    if (data.dealtBy.userId.toString() === currentUserId) {
      console.log('🔄 Обновляем энергию пользователя');
      await authStore.checkAuth();
    }

    // Добавляем в лог
    battleLog.value.push({
      timestamp: Date.now(),
      message: `${data.dealtBy.nickname} нанес ${data.damageDealt} урона`
    });
  });

  socket.on('bossDefeated', data => {
    console.log('💀 Босс побежден:', data);
    if (boss.value) {
      boss.value.state = 'dead';
      boss.value.currentHp = 0;
    }

    battleLog.value.push({
      timestamp: Date.now(),
      message: `Босс ${data.bossName} побежден!`
    });
  });

  socket.on('playerJoined', data => {
    console.log('👤 Игрок присоединился:', data);
    battleLog.value.push({
      timestamp: Date.now(),
      message: `${data.nickname} присоединился к бою`
    });
  });

  socket.on('error', data => {
    console.error('❌ Socket.io ошибка:', data);
    battleLog.value.push({
      timestamp: Date.now(),
      message: `Ошибка: ${data.message}`,
      type: 'error'
    });
  });
};

// Загружаем информацию о боссе
const loadBoss = async () => {
  try {
    const config = useRuntimeConfig();
    const authStore = useAuthStore();

    const response = await $fetch(
      `${config.public.apiBase}/api/boss/${bossId}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      boss.value = response.data.boss;
    }
  } catch (error) {
    console.error('Ошибка загрузки босса:', error);
  }
};

onMounted(async () => {
  await loadBoss();
  connectSocket();
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: 'auth'
});
</script>
