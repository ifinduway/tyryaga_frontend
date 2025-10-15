<template>
  <div class="space-y-6">
    <!-- Навигация -->
    <PageNavigation :breadcrumbs="[{ label: 'Профиль' }]" />

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

    <!-- Экипировка и бонусы -->
    <div class="card">
      <h3 class="text-xl font-bold text-white mb-4">⚔️ Экипировка</h3>

      <div
        v-if="equippedStats"
        class="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4"
      >
        <div class="text-center p-3 bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold text-red-400">
            +{{ equippedStats.damage }}
          </div>
          <div class="text-sm text-gray-400">Урон</div>
        </div>
      </div>

      <div v-else class="text-center text-gray-400 py-4">
        <p>Нет экипированных предметов</p>
      </div>

      <!-- Слоты экипировки -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        <div class="bg-gray-700 rounded-lg p-3">
          <div class="text-sm text-gray-400 mb-2">⛑️ Шлем</div>
          <div v-if="equippedSlots.helmet" class="text-white font-bold">
            {{ equippedSlots.helmet.name }}
          </div>
          <div v-else class="text-gray-500 text-sm italic">Не экипировано</div>
        </div>
        <div class="bg-gray-700 rounded-lg p-3">
          <div class="text-sm text-gray-400 mb-2">👢 Ботинки</div>
          <div v-if="equippedSlots.boots" class="text-white font-bold">
            {{ equippedSlots.boots.name }}
          </div>
          <div v-else class="text-gray-500 text-sm italic">Не экипировано</div>
        </div>
        <div class="bg-gray-700 rounded-lg p-3">
          <div class="text-sm text-gray-400 mb-2">👕 Тело</div>
          <div v-if="equippedSlots.body" class="text-white font-bold">
            {{ equippedSlots.body.name }}
          </div>
          <div v-else class="text-gray-500 text-sm italic">Не экипировано</div>
        </div>
        <div class="bg-gray-700 rounded-lg p-3">
          <div class="text-sm text-gray-400 mb-2">🧤 Перчатки</div>
          <div v-if="equippedSlots.gloves" class="text-white font-bold">
            {{ equippedSlots.gloves.name }}
          </div>
          <div v-else class="text-gray-500 text-sm italic">Не экипировано</div>
        </div>
        <div class="bg-gray-700 rounded-lg p-3">
          <div class="text-sm text-gray-400 mb-2">⚔️ Оружие</div>
          <div v-if="equippedSlots.weapon" class="text-white font-bold">
            {{ equippedSlots.weapon.name }}
          </div>
          <div v-else class="text-gray-500 text-sm italic">Не экипировано</div>
        </div>
        <div class="bg-gray-700 rounded-lg p-3">
          <div class="text-sm text-gray-400 mb-2">💍 Кольцо</div>
          <div v-if="equippedSlots.ring" class="text-white font-bold">
            {{ equippedSlots.ring.name }}
          </div>
          <div v-else class="text-gray-500 text-sm italic">Не экипировано</div>
        </div>
      </div>
    </div>

    <!-- Инвентарь -->
    <div class="card">
      <h3 class="text-xl font-bold text-white mb-4">🎒 Инвентарь</h3>

      <div
        v-if="!inventory || inventory.items.length === 0"
        class="text-center text-gray-400 py-8"
      >
        <div class="text-4xl mb-2">🎒</div>
        <p>Инвентарь пуст</p>
        <p class="text-sm mt-2">Купите предметы в магазине</p>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="item in inventory.items"
          :key="item._id"
          class="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer"
          :class="{ 'ring-2 ring-yellow-500': item.equipped }"
        >
          <div class="text-2xl mb-2">
            {{ getItemIcon(item.itemId.type) }}
          </div>
          <div class="text-sm text-white font-bold">{{ item.itemId.name }}</div>
          <div class="text-xs text-gray-400 mt-1">
            {{ getRarityText(item.itemId.rarity) }}
          </div>
          <div class="text-xs text-gray-400">
            Ур.{{ item.itemId.level }} • x{{ item.quantity }}
          </div>
          <div v-if="item.equipped" class="text-xs text-yellow-400 mt-2">
            🔧 Экипировано
          </div>

          <!-- Действия -->
          <div class="mt-3 flex flex-wrap gap-2">
            <!-- Расходники -->
            <button
              v-if="item.itemId.consumable"
              class="btn-primary text-xs px-2 py-1"
              :disabled="invLoading"
              @click.stop="useItem(item.itemId._id)"
            >
              Использовать
            </button>

            <!-- Экипируемые предметы -->
            <button
              v-else-if="!item.equipped"
              class="btn-secondary text-xs px-2 py-1"
              :disabled="invLoading"
              @click.stop="equipItem(item.itemId._id, item.itemId.type)"
            >
              Экипировать
            </button>

            <button
              v-else
              class="btn-danger text-xs px-2 py-1"
              :disabled="invLoading"
              @click.stop="unequipItem(item.itemId._id)"
            >
              Снять
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="inventory && inventory.items.length > 0"
        class="mt-4 text-sm text-gray-400 text-center"
      >
        Использовано {{ inventory.items.length }} /
        {{ inventory.maxSlots }} слотов
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
            {{ user?.online ? 'Онлайн' : 'Оффлайн' }}
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
import { useAuthStore } from '~/stores/auth';

const { $pinia } = useNuxtApp();
const authStore = useAuthStore($pinia);
const user = computed(() => authStore.user);

const clan = ref(null);
const inventory = ref(null);
const invLoading = ref(false);
const equippedStats = ref(null);
const equippedSlots = ref({
  helmet: null,
  boots: null,
  body: null,
  gloves: null,
  weapon: null,
  ring: null
});

const formatMoney = amount => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};

const formatDate = date => {
  if (!date) return 'Неизвестно';
  return new Date(date).toLocaleDateString('ru-RU');
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

const getItemIcon = type => {
  const icons = {
    helmet: '⛑️',
    boots: '👢',
    body: '👕',
    gloves: '🧤',
    weapon: '⚔️',
    ring: '💍',
    consumable: '💊'
  };
  return icons[type] || '📦';
};

const getRarityText = rarity => {
  const rarities = {
    common: '⚪ Обычный',
    uncommon: '🟢 Необычный',
    rare: '🔵 Редкий',
    epic: '🟣 Эпический',
    legendary: '🟠 Легендарный'
  };
  return rarities[rarity] || rarity;
};

const editProfile = () => {
  // TODO: Реализовать редактирование профиля
  console.log('Редактирование профиля');
};

const logout = () => {
  authStore.logout();
  navigateTo('/login');
};

// Загружаем инвентарь
const loadInventory = async () => {
  try {
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.apiBase}/api/item/inventory/me`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      inventory.value = response.data.inventory;
      console.log('Инвентарь загружен:', inventory.value);
    }
  } catch (error) {
    console.error('Ошибка загрузки инвентаря:', error);
  }
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
    console.error('Ошибка загрузки клана:', error);
  }
};

// Загружаем экипированные предметы
const loadEquippedItems = async () => {
  try {
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.apiBase}/api/item/inventory/me/equipped`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    if (response.ok) {
      equippedStats.value = response.data.stats;
      const equipped = response.data.equipped;

      // Находим экипированные предметы по слотам
      equippedSlots.value = {
        helmet: equipped.find(item => item.slot === 'helmet')?.itemId || null,
        boots: equipped.find(item => item.slot === 'boots')?.itemId || null,
        body: equipped.find(item => item.slot === 'body')?.itemId || null,
        gloves: equipped.find(item => item.slot === 'gloves')?.itemId || null,
        weapon: equipped.find(item => item.slot === 'weapon')?.itemId || null,
        ring: equipped.find(item => item.slot === 'ring')?.itemId || null
      };
    }
  } catch (error) {
    console.error('Ошибка загрузки экипировки:', error);
  }
};

onMounted(() => {
  loadInventory();
  loadClan();
  loadEquippedItems();
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: 'auth'
});

// Действия инвентаря
const useItem = async itemId => {
  if (invLoading.value) return;
  invLoading.value = true;
  try {
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.apiBase}/api/item/${itemId}/use`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );
    if (response.ok) {
      await loadInventory();
      await authStore.checkAuth();
    } else {
      console.error(response.error);
    }
  } catch (e) {
    console.error('Ошибка использования предмета:', e);
  } finally {
    invLoading.value = false;
  }
};

const equipItem = async (itemId, type) => {
  if (invLoading.value) return;
  invLoading.value = true;
  try {
    const slotByType = {
      helmet: 'helmet',
      boots: 'boots',
      body: 'body',
      gloves: 'gloves',
      weapon: 'weapon',
      ring: 'ring'
    };
    const slot = slotByType[type] || null;
    if (!slot) return;
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.apiBase}/api/item/${itemId}/equip`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`
        },
        body: { slot }
      }
    );
    if (response.ok) {
      await Promise.all([loadInventory(), loadEquippedItems()]);
    } else {
      console.error(response.error);
    }
  } catch (e) {
    console.error('Ошибка экипировки:', e);
  } finally {
    invLoading.value = false;
  }
};

const unequipItem = async itemId => {
  if (invLoading.value) return;
  invLoading.value = true;
  try {
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.apiBase}/api/item/${itemId}/unequip`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );
    if (response.ok) {
      await Promise.all([loadInventory(), loadEquippedItems()]);
    } else {
      console.error(response.error);
    }
  } catch (e) {
    console.error('Ошибка снятия:', e);
  } finally {
    invLoading.value = false;
  }
};
</script>
