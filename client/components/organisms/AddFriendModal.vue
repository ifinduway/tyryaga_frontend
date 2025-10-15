<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">➕ Добавить друга</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Введите никнейм игрока, которого хотите добавить в друзья
        </p>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="nickname">Никнейм</label>
            <input
              id="nickname"
              v-model="nickname"
              type="text"
              class="form-input"
              placeholder="Введите никнейм"
              :disabled="loading"
              required
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="$emit('close')"
              :disabled="loading"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="loading || !nickname"
            >
              <span v-if="loading">⏳ Отправка...</span>
              <span v-else>➕ Отправить запрос</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useFriendsStore } from '~/stores/friends';
import { useNotificationsStore } from '~/stores/notifications';

const emit = defineEmits(['close']);

const friendsStore = useFriendsStore();
const notificationsStore = useNotificationsStore();

const nickname = ref('');
const loading = ref(false);
const error = ref(null);

const handleSubmit = async () => {
  if (!nickname.value.trim()) return;

  loading.value = true;
  error.value = null;

  const result = await friendsStore.sendFriendRequest(nickname.value.trim());

  loading.value = false;

  if (result.ok) {
    notificationsStore.addSuccessNotification(
      '✅ Успешно',
      `Запрос отправлен игроку ${nickname.value}`
    );
    emit('close');
  } else {
    error.value = result.error || 'Ошибка отправки запроса';
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
  max-width: 480px;
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
}

.modal-description {
  color: #d1d5db;
  margin-bottom: 20px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #d1d5db;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: #1f2937;
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #7f1d1d;
  color: #fca5a5;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #374151;
  color: #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal-content {
    margin: 0 auto;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
