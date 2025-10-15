<template>
  <div class="min-h-screen bg-gray-900 p-6">
    <PageNavigation :breadcrumbs="[{ label: 'Друзья' }]" />

    <div class="max-w-4xl mx-auto">
      <FriendsList />
    </div>
  </div>
</template>

<script setup>
import FriendsList from '~/components/organisms/FriendsList.vue';

definePageMeta({
  middleware: 'auth'
});
</script>
