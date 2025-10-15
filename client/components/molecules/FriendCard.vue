<template>
  <div class="friend-card">
    <div class="friend-info">
      <div class="friend-avatar">
        <span class="friend-level">{{ friend.level }}</span>
      </div>
      <div class="friend-details">
        <div class="friend-nickname">{{ friend.nickname }}</div>
        <div class="friend-meta">
          <span v-if="friend.status === 'accepted' && friend.acceptedAt">
            Друзья с {{ formatDate(friend.acceptedAt) }}
          </span>
          <span v-else-if="friend.createdAt">
            Запрос от {{ formatDate(friend.createdAt) }}
          </span>
        </div>
      </div>
    </div>

    <div class="friend-actions">
      <!-- Действия для принятых друзей -->
      <button
        v-if="friend.status === 'accepted'"
        class="btn-danger btn-sm"
        @click="$emit('remove', friend.friendshipId)"
      >
        ❌ Удалить
      </button>

      <!-- Действия для входящих запросов -->
      <template v-if="type === 'incoming'">
        <button
          class="btn-success btn-sm"
          @click="$emit('accept', friend.friendshipId)"
        >
          ✅ Принять
        </button>
        <button
          class="btn-secondary btn-sm"
          @click="$emit('decline', friend.friendshipId)"
        >
          ❌ Отклонить
        </button>
      </template>

      <!-- Действия для исходящих запросов -->
      <button
        v-if="type === 'outgoing'"
        class="btn-secondary btn-sm"
        disabled
      >
        ⏳ Ожидание
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  friend: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    default: 'friend' // 'friend', 'incoming', 'outgoing'
  }
});

defineEmits(['remove', 'accept', 'decline']);

const formatDate = dateString => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'сегодня';
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  });
};
</script>

<style scoped>
.friend-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #1f2937;
  border-radius: 8px;
  transition: background 0.2s;
}

.friend-card:hover {
  background: #374151;
}

.friend-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.friend-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 14px;
  position: relative;
}

.friend-level {
  color: white;
}

.friend-details {
  flex: 1;
}

.friend-nickname {
  font-weight: 600;
  color: white;
  font-size: 15px;
  margin-bottom: 4px;
}

.friend-meta {
  font-size: 12px;
  color: #9ca3af;
}

.friend-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .friend-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .friend-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

