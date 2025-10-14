<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-white mb-2">🛒 Магазин</h1>
      <p class="text-gray-400">Покупайте оружие, броню и расходники</p>
    </div>

    <!-- Фильтры -->
    <div class="card">
      <div class="flex flex-wrap items-center gap-4">
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
          @click="filter = 'weapon'"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            filter === 'weapon'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          Оружие
        </button>
        <button
          @click="filter = 'armor'"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            filter === 'armor'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          Броня
        </button>
        <button
          @click="filter = 'consumable'"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            filter === 'consumable'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          Расходники
        </button>
      </div>
    </div>

    <!-- Список предметов -->
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="card hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl"
        :class="`border-l-4 border-${getRarityColor(item.rarity)}-500`"
      >
        <div class="text-center">
          <div class="text-4xl mb-3">{{ item.icon }}</div>
          <h3 class="text-lg font-bold text-white mb-2">{{ item.name }}</h3>
          <p class="text-gray-400 text-sm mb-3">{{ item.description }}</p>

          <!-- Редкость -->
          <div class="mb-3">
            <span
              class="px-2 py-1 rounded text-xs font-medium"
              :class="`bg-${getRarityColor(item.rarity)}-600 text-white`"
            >
              {{ getRarityText(item.rarity) }}
            </span>
          </div>

          <!-- Уровень -->
          <div class="mb-3">
            <span class="text-yellow-400 text-sm"
              >Уровень {{ item.level }}</span
            >
          </div>

          <!-- Статы -->
          <div
            v-if="item.stats && Object.keys(item.stats).length > 0"
            class="mb-3"
          >
            <div
              v-for="(value, stat) in item.stats"
              :key="stat"
              class="text-xs text-gray-300"
            >
              <span v-if="value > 0">
                {{ getStatText(stat) }}: +{{ value }}
              </span>
            </div>
          </div>

          <!-- Эффекты -->
          <div v-if="item.effects && item.effects.length > 0" class="mb-3">
            <div
              v-for="effect in item.effects"
              :key="effect.type"
              class="text-xs text-blue-300"
            >
              {{ getEffectText(effect) }}
            </div>
          </div>

          <!-- Цена -->
          <div class="mb-3">
            <div class="text-green-400 font-bold text-lg">
              {{ formatMoney(item.price) }} 💰
            </div>
            <div class="text-gray-500 text-sm">
              Продажа: {{ formatMoney(item.sellPrice) }}
            </div>
          </div>

          <!-- Кнопка покупки -->
          <button
            @click="buyItem(item)"
            :disabled="!canBuyItem(item) || loading"
            class="w-full btn-primary text-sm py-2"
            :class="{
              'opacity-50 cursor-not-allowed': !canBuyItem(item) || loading
            }"
          >
            <span v-if="loading">Покупка...</span>
            <span v-else-if="!canBuyItem(item)">Недоступно</span>
            <span v-else>Купить</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Сообщение о пустом списке -->
    <div
      v-if="filteredItems.length === 0"
      class="text-center text-gray-400 py-8"
    >
      <div class="text-4xl mb-4">📦</div>
      <p>Нет предметов для отображения</p>
    </div>
  </div>
</template>

<script setup>
const { $pinia } = useNuxtApp();
const authStore = useAuthStore($pinia);

const items = ref([]);
const loading = ref(false);
const filter = ref('all');

const user = computed(() => authStore.user);

// Загружаем предметы
const loadItems = async () => {
  try {
    loading.value = true;
    const config = useRuntimeConfig();
    const response = await $fetch(`${config.public.apiBase}/api/item`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });

    if (response.ok) {
      items.value = response.data.items;
    }
  } catch (error) {
    console.error('Ошибка загрузки предметов:', error);
  } finally {
    loading.value = false;
  }
};

// Фильтруем предметы
const filteredItems = computed(() => {
  if (filter.value === 'all') {
    return items.value;
  }
  return items.value.filter(item => item.type === filter.value);
});

// Покупка предмета
const buyItem = async item => {
  try {
    loading.value = true;
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.apiBase}/api/item/${item.id}/buy`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: {
          quantity: 1
        }
      }
    );

    if (response.ok) {
      // Обновляем данные пользователя
      await authStore.checkAuth();

      // Показываем уведомление
      alert(`Предмет "${item.name}" успешно куплен!`);
    } else {
      alert(`Ошибка: ${response.error}`);
    }
  } catch (error) {
    console.error('Ошибка покупки предмета:', error);
    alert('Ошибка покупки предмета');
  } finally {
    loading.value = false;
  }
};

// Проверяем, можно ли купить предмет
const canBuyItem = item => {
  if (!user.value) return false;
  return user.value.money >= item.price && user.value.level >= item.level;
};

// Получаем цвет редкости
const getRarityColor = rarity => {
  const colors = {
    common: 'gray',
    uncommon: 'green',
    rare: 'blue',
    epic: 'purple',
    legendary: 'yellow'
  };
  return colors[rarity] || 'gray';
};

// Получаем текст редкости
const getRarityText = rarity => {
  const texts = {
    common: 'Обычный',
    uncommon: 'Необычный',
    rare: 'Редкий',
    epic: 'Эпический',
    legendary: 'Легендарный'
  };
  return texts[rarity] || 'Неизвестно';
};

// Получаем текст стата
const getStatText = stat => {
  const texts = {
    damage: 'Урон',
    defense: 'Защита',
    energy: 'Энергия',
    health: 'Здоровье',
    luck: 'Удача'
  };
  return texts[stat] || stat;
};

// Получаем текст эффекта
const getEffectText = effect => {
  const texts = {
    damage_boost: `+${effect.value} урона`,
    defense_boost: `+${effect.value} защиты`,
    energy_restore: `+${effect.value} энергии`,
    health_restore: `+${effect.value} здоровья`,
    luck_boost: `+${effect.value} удачи`
  };
  return texts[effect.type] || effect.type;
};

// Форматируем деньги
const formatMoney = amount => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};

onMounted(() => {
  loadItems();
});
</script>
