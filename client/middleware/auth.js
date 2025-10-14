export default defineNuxtRouteMiddleware((to, from) => {
  const { $pinia } = useNuxtApp();
  const authStore = useAuthStore($pinia);

  if (!authStore.isAuthenticated) {
    return navigateTo("/login");
  }
});
