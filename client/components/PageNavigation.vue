<template>
  <div class="mb-6">
    <!-- Хлебные крошки -->
    <nav class="flex items-center space-x-2 text-sm text-gray-400 mb-4">
      <NuxtLink
        to="/"
        class="hover:text-white transition-colors flex items-center space-x-1"
      >
        <span>🏠</span>
        <span>Главная</span>
      </NuxtLink>

      <template v-if="breadcrumbs.length > 0">
        <span class="text-gray-600">/</span>
        <template v-for="(crumb, index) in breadcrumbs" :key="index">
          <NuxtLink
            v-if="crumb.to && index < breadcrumbs.length - 1"
            :to="crumb.to"
            class="hover:text-white transition-colors"
          >
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="text-white font-medium">{{ crumb.label }}</span>
          <span v-if="index < breadcrumbs.length - 1" class="text-gray-600"
            >/</span
          >
        </template>
      </template>
    </nav>

    <!-- Быстрая навигация -->
    <div
      class="flex flex-wrap items-center gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700"
    >
      <NuxtLink
        to="/"
        class="nav-button"
        :class="{ active: $route.path === '/' }"
      >
        <span class="text-lg">🏠</span>
        <span class="hidden sm:inline">Главная</span>
      </NuxtLink>

      <NuxtLink
        to="/bosses"
        class="nav-button"
        :class="{ active: $route.path.startsWith('/bosses') }"
      >
        <span class="text-lg">👹</span>
        <span class="hidden sm:inline">Боссы</span>
      </NuxtLink>

      <NuxtLink
        to="/work"
        class="nav-button"
        :class="{ active: $route.path === '/work' }"
      >
        <span class="text-lg">💼</span>
        <span class="hidden sm:inline">Работа</span>
      </NuxtLink>

      <NuxtLink
        to="/shop"
        class="nav-button"
        :class="{ active: $route.path === '/shop' }"
      >
        <span class="text-lg">🛒</span>
        <span class="hidden sm:inline">Магазин</span>
      </NuxtLink>

      <NuxtLink
        to="/clans"
        class="nav-button"
        :class="{ active: $route.path.startsWith('/clans') }"
      >
        <span class="text-lg">🏴</span>
        <span class="hidden sm:inline">Кланы</span>
      </NuxtLink>

      <NuxtLink
        to="/profile"
        class="nav-button"
        :class="{ active: $route.path === '/profile' }"
      >
        <span class="text-lg">👤</span>
        <span class="hidden sm:inline">Профиль</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  breadcrumbs: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
.nav-button {
  @apply flex items-center space-x-1 px-3 py-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200;
}

.nav-button.active {
  @apply bg-blue-600 text-white font-medium;
}
</style>
