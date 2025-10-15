import { useCookie } from 'nuxt/app';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isAuthenticated = computed(() => !!tokenCookie.value && !!user.value);

  // Получаем конфигурацию API
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  // Используем cookie для хранения токена
  const tokenCookie = useCookie('auth_token', {
    maxAge: 60 * 60 * 24 * 30, // 30 дней
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  // Computed для получения значения токена
  const token = computed(() => tokenCookie.value);

  // Сохранение токена в cookie
  const saveToken = newToken => {
    tokenCookie.value = newToken;
  };

  // Удаление токена
  const clearToken = () => {
    tokenCookie.value = null;
  };

  // Установка пользователя
  const setUser = userData => {
    user.value = userData;
  };

  // Очистка данных пользователя
  const clearUser = () => {
    user.value = null;
  };

  // Выход из системы
  const logout = () => {
    clearToken();
    clearUser();
  };

  // Проверка аутентификации при загрузке
  const checkAuth = async () => {
    const savedToken = tokenCookie.value;
    if (savedToken) {
      try {
        const response = await $fetch(`${apiBase}/api/auth/verify`, {
          headers: {
            Authorization: `Bearer ${savedToken}`
          }
        });

        if (response.ok) {
          setUser(response.data.user);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Ошибка проверки токена:', error);
        logout();
      }
    }
  };

  // Логин
  const login = async (email, password) => {
    try {
      const response = await $fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        body: {
          email,
          password
        }
      });

      if (response.ok) {
        saveToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  };

  // Регистрация
  const register = async (email, password, nickname) => {
    try {
      const response = await $fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        body: {
          email,
          password,
          nickname
        }
      });

      if (response.ok) {
        saveToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  };

  return {
    user: readonly(user),
    token,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    setUser,
    clearUser
  };
});
