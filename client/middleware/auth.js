export default defineNuxtRouteMiddleware(async (to, from) => {
  const { $pinia } = useNuxtApp();
  const authStore = useAuthStore($pinia);

  // Если токен есть в cookie, но пользователь не загружен - проверяем аутентификацию
  if (authStore.token && !authStore.user) {
    try {
      await authStore.checkAuth();
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
    }
  }

  // Если после проверки все еще не аутентифицирован - перенаправляем на login
  if (!authStore.isAuthenticated) {
    // Избегаем циклических редиректов
    if (to.path !== '/login') {
      return navigateTo('/login');
    }
  }
});
