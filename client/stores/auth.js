import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const token = ref(null);
  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // Получаем конфигурацию API
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  // Сохранение токена в localStorage
  const saveToken = (newToken) => {
    token.value = newToken;
    if (process.client) {
      localStorage.setItem("auth_token", newToken);
    }
  };

  // Удаление токена
  const clearToken = () => {
    token.value = null;
    if (process.client) {
      localStorage.removeItem("auth_token");
    }
  };

  // Установка пользователя
  const setUser = (userData) => {
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
    if (process.client) {
      const savedToken = localStorage.getItem("auth_token");
      if (savedToken) {
        token.value = savedToken;
        try {
          const response = await $fetch(`${apiBase}/api/auth/verify`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          if (response.ok) {
            setUser(response.data.user);
          } else {
            logout();
          }
        } catch (error) {
          console.error("Ошибка проверки токена:", error);
          logout();
        }
      }
    }
  };

  // Логин
  const login = async (email, password) => {
    try {
      const response = await $fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        body: {
          email,
          password,
        },
      });

      if (response.ok) {
        saveToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("Ошибка входа:", error);
      return { success: false, error: "Ошибка подключения к серверу" };
    }
  };

  // Регистрация
  const register = async (email, password, nickname) => {
    try {
      const response = await $fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        body: {
          email,
          password,
          nickname,
        },
      });

      if (response.ok) {
        saveToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      return { success: false, error: "Ошибка подключения к серверу" };
    }
  };

  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    setUser,
    clearUser,
  };
});
