<template>
  <div class="space-y-6">
    <!-- Информация о боссе -->
    <div class="card">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div
            class="text-6xl"
            :class="{
              'animate-bounce': boss?.state === 'available',
              'animate-pulse': boss?.state === 'in_battle',
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
              'bg-green-600 text-white': boss?.state === 'available',
              'bg-orange-600 text-white': boss?.state === 'in_battle',
              'bg-red-600 text-white': boss?.state === 'dead'
            }"
          >
            {{ getStatusText() }}
          </span>
        </div>
      </div>

      <!-- HP бар -->
      <div
        v-if="boss?.state === 'available' || boss?.state === 'in_battle'"
        class="mt-6"
      >
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

      <!-- Информация об экипированном оружии -->
      <div v-if="equippedWeapon" class="mb-4 p-3 bg-gray-700 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-400">Экипировано:</div>
            <div class="text-white font-bold">⚔️ {{ equippedWeapon.name }}</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-400">Бонус урона:</div>
            <div class="text-red-400 font-bold">
              +{{ equippedWeapon.stats?.damage || 0 }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="mb-4 p-3 bg-gray-700 rounded-lg text-center text-gray-400 text-sm"
      >
        Оружие не экипировано. Идите в профиль, чтобы экипировать оружие из
        инвентаря.
      </div>

      <div
        v-if="boss?.state === 'available' || boss?.state === 'in_battle'"
        class="space-y-4"
      >
        <div class="flex items-center gap-3">
          <button class="btn-primary" @click="attack(10)">
            Базовый удар ({{ 10 + (equippedWeapon?.stats?.damage || 0) }})
          </button>
          <button class="btn-secondary" @click="attack(20)">
            Сильный удар ({{ 20 + (equippedWeapon?.stats?.damage || 0) }})
          </button>
        </div>
        <div class="text-xs text-gray-400">
          * Урон учитывает бонус от экипированного оружия, множитель урона ({{
            user?.damageMultiplier || 1
          }}) и шанс крита ({{ user?.critChance || 0 }}%) <br />Экипированная
          броня может давать дополнительные бонусы к криту и урону
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
        <p>Босс недоступен</p>
        <p class="text-sm">Ожидайте возрождения</p>
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
          class="text-sm p-2 bg-gray-700 rounded"
        >
          <span class="text-gray-400">{{ formatTime(log.timestamp) }}</span>
          <span class="text-white ml-2">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { io } from 'socket.io-client';
import { unref } from 'vue';
import { useAuthStore } from '~/stores/auth';

const { $pinia } = useNuxtApp();
const authStore = useAuthStore($pinia);
const user = computed(() => authStore.user);

const route = useRoute();
const bossId = route.params.id;

const boss = ref(null);
const damageAmount = ref(10); // не используется в UI, оставлено для лога
const battleLog = ref([]);
const equippedWeapon = ref(null);

let socket = null;

const getStatusText = () => {
  if (!boss.value) return 'Загрузка...';
  switch (boss.value.state) {
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

const formatDamage = damage => {
  return new Intl.NumberFormat('ru-RU').format(damage);
};

const formatDate = date => {
  return new Date(date).toLocaleString('ru-RU');
};

const formatTime = timestamp => {
  return new Date(timestamp).toLocaleTimeString('ru-RU');
};

// Нанесение урона
const attack = baseDamage => {
  const emitHit = () => {
    console.log('Отправка удара', { bossId, damage: baseDamage });
    socket.emit('dealDamage', { bossId, damage: baseDamage });
    battleLog.value.push({
      timestamp: Date.now(),
      message: `Вы атаковали (${baseDamage})`
    });
  };

  if (!socket) {
    connectSocket();
  }

  if (socket && !socket.connected) {
    socket.once('connect', emitHit);
    try {
      socket.connect();
    } catch (e) {
      console.error('Не удалось инициировать подключение сокета', e);
    }
    return;
  }

  if (socket && socket.connected) {
    emitHit();
  }
};

// Подключение к Socket.io
const connectSocket = () => {
  const token = unref(authStore.token);
  if (!token) return;

  socket = io(useRuntimeConfig().public.wsUrl, {
    auth: {
      token
    }
  });

  socket.on('connect', () => {
    console.log('Подключен к серверу');
    // Присоединяемся к комнате босса
    socket.emit('joinBoss', { bossId });
  });

  socket.on('connect_error', err => {
    console.error('Socket connect_error:', err?.message || err);
    battleLog.value.push({
      timestamp: Date.now(),
      message: `Ошибка сокета: ${err?.message || err}`
    });
  });

  socket.on('error', err => {
    console.error('Socket error:', err);
    const msg = typeof err === 'string' ? err : err?.message || 'Ошибка сокета';
    battleLog.value.push({ timestamp: Date.now(), message: msg });
  });

  socket.on('bossState', data => {
    boss.value = { ...boss.value, ...data };
  });

  socket.on('bossUpdate', data => {
    console.log('📡 Получено обновление босса:', data);
    if (boss.value) {
      boss.value.currentHp = data.currentHp;
      if (data.state) {
        boss.value.state = data.state;
      }
      if (Array.isArray(data.participants)) {
        boss.value.participants = data.participants;
      }
      console.log(
        '🔄 Обновлен босс:',
        boss.value.name,
        'HP:',
        boss.value.currentHp,
        'State:',
        boss.value.state
      );
    }

    // Добавляем в лог
    const currentUserId = user.value?._id || user.value?.id;
    const isMine = data.dealtBy?.userId === currentUserId;

    // Формируем детали урона
    let details = ` [база:${data.damage}`;
    if (data.weaponDamageBonus > 0) {
      details += ` + оружие:${data.weaponDamageBonus}`;
    }
    details += ` = ${data.baseDamageWithWeapon}`;
    details += ` × урон:${data.dmgMult}`;
    if (data.critChanceBonus > 0) {
      details += ` + крит.шанс:${data.critChance}%`;
    }
    if (data.crit) {
      details += ` × крит:${data.critEffectiveMult}`;
    }
    details += `]`;

    const text = isMine
      ? `Вы нанесли ${data.realDamage ?? data.damageDealt} урона${data.crit ? ' (КРИТ)' : ''}${details}`
      : `${data.dealtBy.nickname} нанес ${data.realDamage ?? data.damageDealt} урона${data.crit ? ' (КРИТ)' : ''}${details}`;
    battleLog.value.push({ timestamp: Date.now(), message: text });
  });

  socket.on('bossDefeated', data => {
    battleLog.value.push({
      timestamp: Date.now(),
      message: `Босс ${data.bossName} побежден игроком ${data.dealtBy.nickname}!`
    });
  });
};

// Загружаем информацию о боссе
const loadBoss = async () => {
  try {
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.apiBase}/api/boss/${bossId}`,
      {
        headers: {
          Authorization: `Bearer ${unref(authStore.token)}`
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

// Загружаем информацию об экипированном оружии
const loadEquippedWeapon = async () => {
  try {
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.apiBase}/api/item/inventory/me/equipped`,
      {
        headers: {
          Authorization: `Bearer ${unref(authStore.token)}`
        }
      }
    );

    if (response.ok) {
      const weapon = response.data.equipped.find(
        item => item.slot === 'weapon'
      );
      if (weapon && weapon.itemId) {
        equippedWeapon.value = weapon.itemId;
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки экипировки:', error);
  }
};

onMounted(async () => {
  await Promise.all([loadBoss(), loadEquippedWeapon()]);
  connectSocket();

  // Обновляем экипировку при возвращении на страницу
  window.addEventListener('focus', loadEquippedWeapon);
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
  window.removeEventListener('focus', loadEquippedWeapon);
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: 'auth'
});
</script>
