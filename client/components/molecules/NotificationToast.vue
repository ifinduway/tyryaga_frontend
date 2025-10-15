<template>
  <div
    v-if="notification"
    class="notification-toast"
    :class="[`notification-${notification.type}`, { 'notification-exit': isExiting }]"
  >
    <!-- Иконка -->
    <div class="notification-icon">
      <span v-if="notification.type === 'success'">✅</span>
      <span v-else-if="notification.type === 'error'">❌</span>
      <span v-else-if="notification.type === 'warning'">⚠️</span>
      <span v-else-if="notification.type === 'friendRequest'">👥</span>
      <span v-else-if="notification.type === 'bossInvitation'">⚔️</span>
      <span v-else>ℹ️</span>
    </div>

    <!-- Контент -->
    <div class="notification-content">
      <div class="notification-title">{{ notification.title }}</div>
      <div class="notification-message">{{ notification.message }}</div>

      <!-- Кнопки действий для запроса в друзья -->
      <div
        v-if="notification.type === 'friendRequest'"
        class="notification-actions"
      >
        <button
          class="btn-accept"
          @click="acceptFriendRequest"
        >
          ✅ Принять
        </button>
        <button
          class="btn-decline"
          @click="declineFriendRequest"
        >
          ❌ Отклонить
        </button>
      </div>

      <!-- Кнопка для приглашения в бой -->
      <div
        v-if="notification.type === 'bossInvitation'"
        class="notification-actions"
      >
        <button
          class="btn-accept"
          @click="acceptBossInvitation"
        >
          ⚔️ Присоединиться
        </button>
        <button
          class="btn-decline"
          @click="declineBossInvitation"
        >
          ❌ Отклонить
        </button>
      </div>
    </div>

    <!-- Кнопка закрытия -->
    <button
      class="notification-close"
      @click="closeNotification"
    >
      ×
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFriendsStore } from '~/stores/friends';
import { useNotificationsStore } from '~/stores/notifications';

const props = defineProps({
  notification: {
    type: Object,
    required: true
  }
});

const router = useRouter();
const friendsStore = useFriendsStore();
const notificationsStore = useNotificationsStore();

const isExiting = ref(false);

// Закрыть уведомление
const closeNotification = () => {
  isExiting.value = true;
  setTimeout(() => {
    notificationsStore.removeNotification(props.notification.id);
  }, 300);
};

// Принять запрос в друзья
const acceptFriendRequest = async () => {
  const result = await friendsStore.acceptFriendRequest(
    props.notification.data.requestId
  );

  if (result.ok) {
    notificationsStore.addSuccessNotification(
      '✅ Успешно',
      `Вы добавили ${props.notification.data.from.nickname} в друзья`
    );
  } else {
    notificationsStore.addErrorNotification('❌ Ошибка', result.error || 'Не удалось принять запрос');
  }

  closeNotification();
};

// Отклонить запрос в друзья
const declineFriendRequest = async () => {
  await friendsStore.declineFriendRequest(props.notification.data.requestId);
  closeNotification();
};

// Принять приглашение в бой
const acceptBossInvitation = async () => {
  const instanceId = props.notification.data.invitationId;
  router.push(`/bosses/${instanceId}`);
  closeNotification();
};

// Отклонить приглашение в бой
const declineBossInvitation = () => {
  closeNotification();
};
</script>

<style scoped>
.notification-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #1f2937;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 320px;
  max-width: 420px;
  animation: slideIn 0.3s ease-out;
  border-left: 4px solid #3b82f6;
}

.notification-toast.notification-exit {
  animation: slideOut 0.3s ease-in;
}

.notification-success {
  border-left-color: #10b981;
}

.notification-error {
  border-left-color: #ef4444;
}

.notification-warning {
  border-left-color: #f59e0b;
}

.notification-friendRequest {
  border-left-color: #8b5cf6;
}

.notification-bossInvitation {
  border-left-color: #dc2626;
}

.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  color: white;
  margin-bottom: 4px;
  font-size: 14px;
}

.notification-message {
  color: #d1d5db;
  font-size: 13px;
  line-height: 1.4;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-accept,
.btn-decline {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-accept {
  background: #10b981;
  color: white;
}

.btn-accept:hover {
  background: #059669;
}

.btn-decline {
  background: #6b7280;
  color: white;
}

.btn-decline:hover {
  background: #4b5563;
}

.notification-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s;
}

.notification-close:hover {
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>

