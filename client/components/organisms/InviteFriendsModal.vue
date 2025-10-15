<template>
  <div
    class="modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">👥 Пригласить друзей</h3>
        <button
          class="modal-close"
          @click="$emit('close')"
        >
          ×
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Выберите друзей, которых хотите пригласить в бой
        </p>

        <!-- Загрузка -->
        <div
          v-if="friendsStore.loading"
          class="loading-state"
        >
          <div class="spinner"></div>
          <p>Загрузка друзей...</p>
        </div>

        <!-- Список друзей -->
        <div
          v-else-if="availableFriends.length > 0"
          class="friends-list"
        >
          <div
            v-for="friend in availableFriends"
            :key="friend.userId"
            class="friend-item"
            :class="{ inviting: invitingFriends.includes(friend.userId) }"
          >
            <div class="friend-info">
              <div class="friend-avatar">
                {{ friend.level }}
              </div>
              <div>
                <div class="friend-name">{{ friend.nickname }}</div>
                <div class="friend-level">Уровень {{ friend.level }}</div>
              </div>
            </div>

            <button
              v-if="!invitedFriends.includes(friend.userId)"
              class="btn-invite"
              :disabled="invitingFriends.includes(friend.userId)"
              @click="inviteFriend(friend)"
            >
              <span v-if="invitingFriends.includes(friend.userId)">⏳</span>
              <span v-else>➕ Пригласить</span>
            </button>
            <span
              v-else
              class="invited-badge"
            >✅ Приглашен</span>
          </div>
        </div>

        <!-- Пустое состояние -->
        <div
          v-else
          class="empty-state"
        >
          <div class="empty-icon">👥</div>
          <p>У вас нет доступных друзей для приглашения</p>
          <p class="empty-hint">
            Добавьте друзей, чтобы приглашать их в приватные бои
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn-secondary"
          @click="$emit('close')"
        >
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useFriendsStore } from '~/stores/friends';
import { useNotificationsStore } from '~/stores/notifications';

const props = defineProps({
  instanceId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'invited']);

const config = useRuntimeConfig();
const authStore = useAuthStore();
const friendsStore = useFriendsStore();
const notificationsStore = useNotificationsStore();

const invitedFriends = ref([]);
const invitingFriends = ref([]);

// Доступные друзья (еще не приглашенные)
const availableFriends = computed(() => {
  return friendsStore.friends;
});

onMounted(async () => {
  // Загружаем список друзей
  await friendsStore.loadFriends();
});

// Пригласить друга
const inviteFriend = async friend => {
  invitingFriends.value.push(friend.userId);

  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/boss/instance/${props.instanceId}/invite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`
        },
        body: {
          friendId: friend.userId
        }
      }
    );

    if (response.ok) {
      invitedFriends.value.push(friend.userId);
      notificationsStore.addSuccessNotification(
        '✅ Успешно',
        `Приглашение отправлено игроку ${friend.nickname}`
      );
      emit('invited', friend);
    }
  } catch (error) {
    console.error('Ошибка приглашения друга:', error);
    notificationsStore.addErrorNotification(
      '❌ Ошибка',
      error.data?.error || 'Не удалось отправить приглашение'
    );
  } finally {
    invitingFriends.value = invitingFriends.value.filter(id => id !== friend.userId);
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: #1f2937;
  border-radius: 12px;
  width: 100%;
  max-width: 540px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #374151;
}

.modal-title {
  font-size: 20px;
  font-weight: bold;
  color: white;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #374151;
  color: white;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-description {
  color: #d1d5db;
  margin-bottom: 20px;
  font-size: 14px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #9ca3af;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #374151;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #374151;
  border-radius: 8px;
  transition: background 0.2s;
}

.friend-item:hover {
  background: #4b5563;
}

.friend-item.inviting {
  opacity: 0.6;
}

.friend-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.friend-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 14px;
}

.friend-name {
  color: white;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.friend-level {
  color: #9ca3af;
  font-size: 12px;
}

.btn-invite {
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-invite:hover:not(:disabled) {
  background: #2563eb;
}

.btn-invite:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.invited-badge {
  padding: 6px 12px;
  background: #10b981;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 12px;
  color: #6b7280;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #374151;
}

.btn-secondary {
  padding: 10px 20px;
  background: #374151;
  color: #d1d5db;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #4b5563;
}

@media (max-width: 640px) {
  .modal-content {
    max-height: 90vh;
  }
}
</style>

