<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-red-600 mb-2">ТЮРЯГА</h1>
        <p class="text-gray-400">Браузерная онлайн-игра</p>
      </div>

      <div class="card">
        <div class="flex space-x-1 mb-6">
          <button
            @click="activeTab = 'login'"
            class="flex-1 py-2 px-4 text-center rounded-t-lg transition-colors"
            :class="
              activeTab === 'login'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            "
          >
            Вход
          </button>
          <button
            @click="activeTab = 'register'"
            class="flex-1 py-2 px-4 text-center rounded-t-lg transition-colors"
            :class="
              activeTab === 'register'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            "
          >
            Регистрация
          </button>
        </div>

        <!-- Форма входа -->
        <form
          v-if="activeTab === 'login'"
          @submit.prevent="handleLogin"
          class="space-y-4"
        >
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Email</label
            >
            <input
              v-model="loginForm.email"
              type="email"
              required
              class="input-field w-full"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Пароль</label
            >
            <input
              v-model="loginForm.password"
              type="password"
              required
              class="input-field w-full"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="btn-primary w-full"
          >
            <span v-if="isLoading">Вход...</span>
            <span v-else>Войти в игру</span>
          </button>
        </form>

        <!-- Форма регистрации -->
        <form
          v-if="activeTab === 'register'"
          @submit.prevent="handleRegister"
          class="space-y-4"
        >
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Email</label
            >
            <input
              v-model="registerForm.email"
              type="email"
              required
              class="input-field w-full"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Никнейм</label
            >
            <input
              v-model="registerForm.nickname"
              type="text"
              required
              minlength="3"
              maxlength="20"
              class="input-field w-full"
              placeholder="Ваш игровой ник"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Пароль</label
            >
            <input
              v-model="registerForm.password"
              type="password"
              required
              minlength="6"
              class="input-field w-full"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Подтверждение пароля</label
            >
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              required
              class="input-field w-full"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            :disabled="
              isLoading ||
              registerForm.password !== registerForm.confirmPassword
            "
            class="btn-primary w-full"
          >
            <span v-if="isLoading">Регистрация...</span>
            <span v-else>Создать аккаунт</span>
          </button>
        </form>

        <!-- Сообщения об ошибках -->
        <div
          v-if="error"
          class="mt-4 p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm"
        >
          {{ error }}
        </div>
      </div>

      <div class="text-center text-gray-500 text-sm">
        <p>Добро пожаловать в мир криминала!</p>
        <p>Сражайтесь с боссами, создавайте братвы и зарабатывайте уважение.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const activeTab = ref('login');
const isLoading = ref(false);
const error = ref('');

const loginForm = ref({
  email: '',
  password: ''
});

const registerForm = ref({
  email: '',
  nickname: '',
  password: '',
  confirmPassword: ''
});

const handleLogin = async () => {
  isLoading.value = true;
  error.value = '';

  const result = await authStore.login(
    loginForm.value.email,
    loginForm.value.password
  );

  if (result.success) {
    await router.push('/');
  } else {
    error.value = result.error;
  }

  isLoading.value = false;
};

const handleRegister = async () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    error.value = 'Пароли не совпадают';
    return;
  }

  isLoading.value = true;
  error.value = '';

  const result = await authStore.register(
    registerForm.value.email,
    registerForm.value.password,
    registerForm.value.nickname
  );

  if (result.success) {
    await router.push('/');
  } else {
    error.value = result.error;
  }

  isLoading.value = false;
};

// Редирект если уже авторизован
onMounted(async () => {
  // Проверяем, есть ли токен в cookie
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth();
  }

  // Если пользователь авторизован, перенаправляем на главную
  if (authStore.isAuthenticated) {
    router.push('/');
  }
});
</script>
