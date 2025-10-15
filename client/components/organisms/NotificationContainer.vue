<template>
  <div class="notification-container">
    <NotificationToast
      v-for="notification in notifications"
      :key="notification.id"
      :notification="notification"
    />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '~/stores/notifications';
import NotificationToast from '~/components/molecules/NotificationToast.vue';

const notificationsStore = useNotificationsStore();
const { notifications } = storeToRefs(notificationsStore);
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notification-container > * {
  pointer-events: auto;
}

@media (max-width: 640px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
}
</style>
