<template>
  <div class="space-y-6">
    <!-- Информация об инстансе -->
    <div class="card">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div
            class="text-6xl"
            :class="{
              'animate-bounce': instance?.currentHp > 0,
              'animate-spin': instance?.isCompleted
            }"
          >
            {{ instance?.isCompleted ? '💀' : '👹' }}
          </div>
          <div>
            <h1
              class="text-3xl font-bold text-white bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent"
            >
              {{ instance?.templateName }}
            </h1>
            <p class="text-gray-400">Уровень {{ instance?.templateLevel }}</p>
            <p v-if="instance?.ownerNickname" class="text-sm text-gray-500">
              {{
                instance.isOwner
                  ? '👑 Вы владелец'
                  : `👤 Владелец: ${instance.ownerNickname}`
              }}
            </p>
          </div>
        </div>

        <div class="text-right">
          <div class="text-sm text-gray-400 mb-1">Статус</div>
          <span
            v-if="instance?.isCompleted"
            class="px-3 py-1 rounded text-sm font-medium bg-red-600 text-white"
          >
            Побежден
          </span>
          <span
            v-else-if="isExpired"
            class="px-3 py-1 rounded text-sm font-medium bg-gray-600 text-white"
          >
            Истек
          </span>
          <span
            v-else
            class="px-3 py-1 rounded text-sm font-medium bg-orange-600 text-white"
          >
            В бою
          </span>
        </div>
      </div>

      <!-- Таймер -->
      <div v-if="!instance?.isCompleted && !isExpired" class="mt-4">
        <div
          class="flex items-center justify-between text-sm text-gray-400 mb-2"
        >
          <span>Оставшееся время</span>
          <span
            class="text-lg font-bold"
            :class="timeRemaining < 60000 ? 'text-red-400' : 'text-white'"
          >
            {{ formatTimeRemaining() }}
          </span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2">
          <div
            class="bg-orange-500 h-2 rounded-full transition-all duration-1000"
            :style="{ width: `${timeRemainingPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- HP бар -->
      <div v-if="!instance?.isCompleted && !isExpired" class="mt-6">
        <div class="flex justify-between text-sm text-gray-400 mb-2">
          <span>Здоровье</span>
          <span>{{ instance?.currentHp }}/{{ instance?.maxHp }}</span>
        </div>
        <div
          class="w-full bg-gray-700 rounded-full h-6 relative overflow-hidden"
        >
          <div
            class="bg-gradient-to-r from-red-500 to-red-600 h-6 rounded-full transition-all duration-500 relative"
            :style="{
              width: `${(instance?.currentHp / instance?.maxHp) * 100}%`
            }"
          >
            <div
              class="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-30 animate-pulse"
            ></div>
          </div>
          <div
            class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
          >
            {{ Math.round((instance?.currentHp / instance?.maxHp) * 100) }}%
          </div>
        </div>
      </div>

      <!-- Награды -->
      <div class="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-green-400">
            {{ formatMoney(instance?.rewards?.money) }}
          </div>
          <div class="text-sm text-gray-400">Деньги</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-blue-400">
            {{ instance?.rewards?.exp }}
          </div>
          <div class="text-sm text-gray-400">Опыт</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-purple-400">
            {{ instance?.rewards?.items?.length || 0 }}
          </div>
          <div class="text-sm text-gray-400">Предметы</div>
        </div>
      </div>
    </div>

    <!-- Участники боя -->
    <div class="card">
      <h2 class="text-xl font-bold text-white mb-4">👥 Участники боя</h2>

      <div
        v-if="instance?.participants?.length === 0"
        class="text-center text-gray-400 py-8"
      >
        <div class="text-4xl mb-2">😴</div>
        <p>Пока никто не участвует в бою</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="participant in instance?.participants"
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

      <div v-if="!instance?.isCompleted && !isExpired" class="space-y-4">
        <!-- Кнопка приглашения друзей (только для владельца приватного инстанса) -->
        <button
          v-if="instance?.isOwner && instance?.isPrivate"
          class="w-full btn-primary bg-purple-600 hover:bg-purple-700"
          @click="showInviteFriendsModal = true"
        >
          👥 Пригласить друзей в бой
        </button>

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
        v-else-if="instance?.isCompleted"
        class="text-center text-gray-400 py-8"
      >
        <div class="text-4xl mb-2">💀</div>
        <p>Босс побежден!</p>
        <p class="text-sm">Награды уже распределены</p>
        <button @click="navigateTo('/bosses')" class="btn-primary mt-4">
          Вернуться к списку боссов
        </button>
      </div>

      <div v-else-if="isExpired" class="text-center text-gray-400 py-8">
        <div class="text-4xl mb-2">⏰</div>
        <p>Время истекло!</p>
        <p class="text-sm">Инстанс больше недоступен</p>
        <button @click="navigateTo('/bosses')" class="btn-primary mt-4">
          Вернуться к списку боссов
        </button>
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

    <!-- Модальное окно приглашения друзей -->
    <InviteFriendsModal
      v-if="showInviteFriendsModal"
      :instance-id="instanceId"
      @close="showInviteFriendsModal = false"
    />
  </div>
</template>

<script setup>
import { io } from 'socket.io-client';
import { unref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import InviteFriendsModal from '~/components/organisms/InviteFriendsModal.vue';

const { $pinia } = useNuxtApp();
const authStore = useAuthStore($pinia);
const user = computed(() => authStore.user);

const route = useRoute();
const instanceId = route.params.id;
const config = useRuntimeConfig();

const instance = ref(null);
const battleLog = ref([]);
const equippedWeapon = ref(null);
const timeRemaining = ref(0);
const isExpired = ref(false);
const showInviteFriendsModal = ref(false);

let socket = null;
let timerInterval = null;

const timeRemainingPercentage = computed(() => {
  if (!instance.value) return 0;
  const total =
    new Date(instance.value.expiresAt) - new Date(instance.value.createdAt);
  const remaining = timeRemaining.value;
  return Math.max(0, Math.min(100, (remaining / total) * 100));
});

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

const formatTimeRemaining = () => {
  const minutes = Math.floor(timeRemaining.value / 60000);
  const seconds = Math.floor((timeRemaining.value % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Обновление таймера
const updateTimer = () => {
  if (!instance.value) return;

  const now = new Date();
  const expires = new Date(instance.value.expiresAt);
  const remaining = expires - now;

  if (remaining <= 0) {
    timeRemaining.value = 0;
    isExpired.value = true;
    if (socket) {
      socket.disconnect();
    }
  } else {
    timeRemaining.value = remaining;
  }
};

// Нанесение урона
const attack = baseDamage => {
  if (!socket || !socket.connected) {
    console.error('Socket не подключен');
    return;
  }

  console.log('Отправка удара', { instanceId, damage: baseDamage });
  socket.emit('dealDamage', { instanceId, damage: baseDamage });
  battleLog.value.push({
    timestamp: Date.now(),
    message: `Вы атаковали (${baseDamage})`
  });
};

// Подключение к Socket.io
const connectSocket = () => {
  // Если сокет уже существует и подключен, не создаем новый
  if (socket && socket.connected) {
    console.log('Socket уже подключен, используем существующий');
    socket.emit('joinBossInstance', { instanceId });
    return;
  }

  // Если сокет существует но отключен, отключаем его полностью
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
  }

  const token = unref(authStore.token);
  if (!token) return;

  console.log('Создаем новое подключение к Socket.io');
  socket = io(config.public.wsUrl, {
    auth: {
      token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✅ Socket подключен к серверу');
    // Присоединяемся к комнате инстанса
    socket.emit('joinBossInstance', { instanceId });
  });

  socket.on('reconnect', attemptNumber => {
    console.log(`🔄 Socket переподключен после ${attemptNumber} попыток`);
    // При переподключении снова присоединяемся к комнате
    socket.emit('joinBossInstance', { instanceId });
  });

  socket.on('disconnect', reason => {
    console.log('❌ Socket отключен:', reason);
    if (reason === 'io server disconnect') {
      // Сервер принудительно отключил, переподключаемся вручную
      socket.connect();
    }
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

  socket.on('bossInstanceState', data => {
    console.log('📡 Получено состояние инстанса:', data);
    if (instance.value) {
      // Обновляем реактивно
      instance.value = {
        ...instance.value,
        currentHp: data.currentHp,
        participants: data.participants,
        isCompleted: data.isCompleted,
        ownerId: data.ownerId,
        ownerNickname: data.ownerNickname,
        isOwner: data.isOwner
      };
    }
  });

  socket.on('playerJoined', data => {
    console.log('👥 Игрок присоединился:', data.player);
    battleLog.value.push({
      timestamp: Date.now(),
      message: `${data.player.nickname} присоединился к бою!`
    });
  });

  socket.on('bossInstanceUpdate', data => {
    console.log('📡 Получено обновление инстанса:', data);
    if (instance.value) {
      // Обновляем реактивно, создавая новый объект
      instance.value = {
        ...instance.value,
        currentHp: data.currentHp,
        isCompleted: data.isCompleted,
        participants: Array.isArray(data.participants)
          ? data.participants
          : instance.value.participants
      };
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

  socket.on('bossInstanceDefeated', data => {
    console.log('💀 Босс побежден:', data);
    battleLog.value.push({
      timestamp: Date.now(),
      message: `Босс ${data.bossName} побежден игроком ${data.dealtBy.nickname}!`
    });

    // Показываем награды
    if (data.rewards && data.rewards.length > 0) {
      const userReward = data.rewards.find(
        r => r.userId === (user.value?._id || user.value?.id)
      );
      if (userReward) {
        battleLog.value.push({
          timestamp: Date.now(),
          message: `Вы получили: ${userReward.money}💰 ${userReward.exp}⭐ (${userReward.damagePercentage}% урона)`
        });
        if (userReward.levelsGained?.length > 0) {
          battleLog.value.push({
            timestamp: Date.now(),
            message: `🎉 Вы достигли ${userReward.levelsGained.join(', ')} уровня!`
          });
        }

        // Обновляем статистику пользователя в store
        if (authStore.user) {
          const newMoney = (authStore.user.money || 0) + userReward.money;
          const newExp = (authStore.user.exp || 0) + userReward.exp;
          let newLevel = authStore.user.level || 1;

          if (userReward.levelsGained?.length > 0) {
            newLevel =
              userReward.levelsGained[userReward.levelsGained.length - 1];
          }

          authStore.updateUserStats({
            money: newMoney,
            exp: newExp,
            level: newLevel
          });

          console.log(
            '✅ Статистика пользователя обновлена из bossInstanceDefeated'
          );
        }
      }
    }
  });

  socket.on('bossRewards', data => {
    console.log('🎁 Получены награды:', data);
    battleLog.value.push({
      timestamp: Date.now(),
      message: `Награды: ${data.money}💰 ${data.exp}⭐`
    });

    // Обновляем статистику пользователя в store
    if (authStore.user) {
      const newMoney = (authStore.user.money || 0) + data.money;
      const newExp = (authStore.user.exp || 0) + data.exp;
      let newLevel = authStore.user.level || 1;

      // Обрабатываем повышение уровня
      if (data.levelsGained && data.levelsGained.length > 0) {
        newLevel = data.levelsGained[data.levelsGained.length - 1];
        battleLog.value.push({
          timestamp: Date.now(),
          message: `🎉 Вы достигли ${data.levelsGained.join(', ')} уровня!`
        });
      }

      authStore.updateUserStats({
        money: newMoney,
        exp: newExp,
        level: newLevel
      });

      console.log('✅ Статистика пользователя обновлена:', {
        money: newMoney,
        exp: newExp,
        level: newLevel
      });
    }
  });
};

// Загружаем информацию об инстансе
const loadInstance = async () => {
  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/boss/instance/${instanceId}`,
      {
        headers: {
          Authorization: `Bearer ${unref(authStore.token)}`
        }
      }
    );

    if (response.ok) {
      instance.value = response.data.instance;
      console.log('📋 Загружен инстанс:', instance.value);

      // Проверяем истечение
      const now = new Date();
      const expires = new Date(instance.value.expiresAt);
      if (now >= expires) {
        isExpired.value = true;
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки инстанса:', error);
    if (error.status === 404 || error.status === 403) {
      // Инстанс не найден или нет доступа
      navigateTo('/bosses');
    }
  }
};

// Загружаем информацию об экипированном оружии
const loadEquippedWeapon = async () => {
  try {
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
  await Promise.all([loadInstance(), loadEquippedWeapon()]);

  if (!isExpired.value) {
    connectSocket();

    // Запускаем таймер
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  }

  // Обновляем экипировку при возвращении на страницу
  window.addEventListener('focus', loadEquippedWeapon);
});

onUnmounted(() => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  window.removeEventListener('focus', loadEquippedWeapon);
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: 'auth'
});
</script>
