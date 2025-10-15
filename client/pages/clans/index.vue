<template>
  <div class="space-y-6">
    <!-- Навигация -->
    <PageNavigation :breadcrumbs="[{ label: 'Кланы' }]" />

    <div class="text-center">
      <h1 class="text-3xl font-bold text-white mb-2">🏴 Братва</h1>
      <p class="text-gray-400">Создайте или присоединитесь к клану</p>
    </div>

    <!-- Действия -->
    <div class="card">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white mb-2">Ваш клан</h2>
          <p class="text-gray-400">
            {{
              user?.clanId ? 'Вы состоите в клане' : 'Вы не состоите в клане'
            }}
          </p>
        </div>

        <div class="flex space-x-3">
          <button
            v-if="!user?.clanId"
            @click="showCreateModal = true"
            class="btn-primary"
          >
            Создать клан
          </button>

          <NuxtLink
            v-if="user?.clanId"
            :to="`/clans/${user.clanId}`"
            class="btn-secondary"
          >
            Перейти к клану
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Поиск кланов -->
    <div class="card">
      <h2 class="text-xl font-bold text-white mb-4">🔍 Поиск кланов</h2>

      <div class="flex space-x-4 mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по названию..."
          class="input-field flex-1"
          @input="searchClans"
        />
        <button @click="loadClans" class="btn-secondary">Обновить</button>
      </div>

      <!-- Список кланов -->
      <div v-if="clans.length === 0" class="text-center text-gray-400 py-8">
        <div class="text-4xl mb-2">🔍</div>
        <p>Кланы не найдены</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="clan in clans"
          :key="clan.id"
          class="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <div class="flex items-center space-x-4">
            <div class="text-3xl">🏴</div>
            <div>
              <div class="font-bold text-white">{{ clan.name }}</div>
              <div class="text-sm text-gray-400">{{ clan.description }}</div>
              <div class="text-xs text-gray-500">
                Лидер: {{ clan.leader.nickname }} • Уровень {{ clan.level }}
              </div>
            </div>
          </div>

          <div class="text-right">
            <div class="text-sm text-gray-400 mb-1">
              {{ clan.memberCount }}/{{ clan.maxMembers }} участников
            </div>
            <div class="text-sm text-green-400 mb-2">
              Банк: {{ formatMoney(clan.bank) }}
            </div>

            <button
              v-if="!user?.clanId"
              @click="joinClan(clan.id)"
              :disabled="clan.memberCount >= clan.maxMembers"
              class="btn-primary text-sm px-3 py-1"
              :class="{
                'opacity-50 cursor-not-allowed':
                  clan.memberCount >= clan.maxMembers
              }"
            >
              {{
                clan.memberCount >= clan.maxMembers ? 'Клан полон' : 'Вступить'
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- Пагинация -->
      <div
        v-if="pagination.pages > 1"
        class="flex justify-center space-x-2 mt-6"
      >
        <button
          v-for="page in pagination.pages"
          :key="page"
          @click="loadClans(page)"
          class="px-3 py-1 rounded text-sm transition-colors"
          :class="
            pagination.page === page
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
        >
          {{ page }}
        </button>
      </div>
    </div>

    <!-- Модальное окно создания клана -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-xl font-bold text-white mb-4">Создать клан</h3>

        <form @submit.prevent="createClan" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Название клана</label
            >
            <input
              v-model="createForm.name"
              type="text"
              required
              minlength="3"
              maxlength="30"
              class="input-field w-full"
              placeholder="Название вашего клана"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Описание</label
            >
            <textarea
              v-model="createForm.description"
              maxlength="200"
              rows="3"
              class="input-field w-full"
              placeholder="Описание клана (необязательно)"
            ></textarea>
          </div>

          <div class="flex space-x-3">
            <button
              type="submit"
              :disabled="!createForm.name || isLoading"
              class="btn-primary flex-1"
            >
              <span v-if="isLoading">Создание...</span>
              <span v-else>Создать клан</span>
            </button>

            <button
              type="button"
              @click="showCreateModal = false"
              class="btn-secondary flex-1"
            >
              Отмена
            </button>
          </div>
        </form>

        <div
          v-if="error"
          class="mt-4 p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm"
        >
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth';

const { $pinia } = useNuxtApp();
const authStore = useAuthStore($pinia);
const user = computed(() => authStore.user);

const clans = ref([]);
const searchQuery = ref('');
const showCreateModal = ref(false);
const isLoading = ref(false);
const error = ref('');

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
});

const createForm = ref({
  name: '',
  description: ''
});

const formatMoney = amount => {
  return new Intl.NumberFormat('ru-RU').format(amount);
};

// Загрузка списка кланов
const loadClans = async (page = 1) => {
  try {
    const params = {
      page,
      limit: pagination.value.limit
    };

    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    const config = useRuntimeConfig();
    const response = await $fetch(`${config.public.apiBase}/api/clans`, {
      query: params
    });

    if (response.ok) {
      clans.value = response.data.clans;
      pagination.value = response.data.pagination;
    }
  } catch (error) {
    console.error('Ошибка загрузки кланов:', error);
  }
};

// Поиск кланов
const searchClans = useDebounceFn(() => {
  loadClans(1);
}, 500);

// Создание клана
const createClan = async () => {
  if (!createForm.value.name) return;

  isLoading.value = true;
  error.value = '';

  try {
    const config = useRuntimeConfig();
    const response = await $fetch(`${config.public.apiBase}/api/clans`, {
      method: 'POST',
      body: {
        name: createForm.value.name,
        description: createForm.value.description
      }
    });

    if (response.ok) {
      showCreateModal.value = false;
      createForm.value = { name: '', description: '' };
      await authStore.checkAuth(); // Обновляем данные пользователя
      await loadClans();
    } else {
      error.value = response.error;
    }
  } catch (error) {
    console.error('Ошибка создания клана:', error);
    error.value = 'Ошибка создания клана';
  }

  isLoading.value = false;
};

// Вступление в клан
const joinClan = async clanId => {
  try {
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.apiBase}/api/clans/${clanId}/join`,
      {
        method: 'POST'
      }
    );

    if (response.ok) {
      await authStore.checkAuth(); // Обновляем данные пользователя
      await loadClans();
    } else {
      error.value = response.error;
    }
  } catch (error) {
    console.error('Ошибка вступления в клан:', error);
    error.value = 'Ошибка вступления в клан';
  }
};

onMounted(() => {
  loadClans();
});

// Middleware для проверки аутентификации
definePageMeta({
  middleware: 'auth'
});
</script>
