<template>
  <div class="friends-list-container">
    <!-- Заголовок и кнопка добавить друга -->
    <div class="friends-header">
      <h2 class="friends-title">👥 Друзья</h2>
      <button class="btn-primary btn-sm" @click="showAddFriendModal = true">
        ➕ Добавить
      </button>
    </div>

    <!-- Вкладки -->
    <div class="friends-tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'friends' }"
        @click="activeTab = 'friends'"
      >
        Друзья ({{ friendsStore.friendsCount }})
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'incoming' }"
        @click="activeTab = 'incoming'"
      >
        Входящие ({{ friendsStore.incomingRequestsCount }})
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'outgoing' }"
        @click="activeTab = 'outgoing'"
      >
        Исходящие ({{ friendsStore.outgoingRequestsCount }})
      </button>
    </div>

    <!-- Загрузка -->
    <div v-if="friendsStore.loading" class="friends-loading">
      <div class="spinner"></div>
      <p>Загрузка...</p>
    </div>

    <!-- Список друзей -->
    <div v-else-if="activeTab === 'friends'" class="friends-content">
      <FriendCard
        v-for="friend in friendsStore.friends"
        :key="friend.friendshipId"
        :friend="friend"
        type="friend"
        @remove="handleRemoveFriend"
      />

      <div v-if="friendsStore.friends.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <p>У вас пока нет друзей</p>
        <button class="btn-primary btn-sm" @click="showAddFriendModal = true">
          ➕ Добавить друга
        </button>
      </div>
    </div>

    <!-- Входящие запросы -->
    <div v-else-if="activeTab === 'incoming'" class="friends-content">
      <FriendCard
        v-for="request in friendsStore.incomingRequests"
        :key="request.friendshipId"
        :friend="request"
        type="incoming"
        @accept="handleAcceptRequest"
        @decline="handleDeclineRequest"
      />

      <div
        v-if="friendsStore.incomingRequests.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">📭</div>
        <p>Нет входящих запросов</p>
      </div>
    </div>

    <!-- Исходящие запросы -->
    <div v-else-if="activeTab === 'outgoing'" class="friends-content">
      <FriendCard
        v-for="request in friendsStore.outgoingRequests"
        :key="request.friendshipId"
        :friend="request"
        type="outgoing"
      />

      <div
        v-if="friendsStore.outgoingRequests.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">📤</div>
        <p>Нет исходящих запросов</p>
      </div>
    </div>

    <!-- Модальное окно добавления друга -->
    <AddFriendModal
      v-if="showAddFriendModal"
      @close="showAddFriendModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFriendsStore } from '~/stores/friends';
import { useNotificationsStore } from '~/stores/notifications';
import FriendCard from '~/components/molecules/FriendCard.vue';
import AddFriendModal from '~/components/organisms/AddFriendModal.vue';

const friendsStore = useFriendsStore();
const notificationsStore = useNotificationsStore();

const activeTab = ref('friends');
const showAddFriendModal = ref(false);

onMounted(async () => {
  await friendsStore.loadFriends();
});

const handleRemoveFriend = async friendshipId => {
  if (!confirm('Вы уверены, что хотите удалить друга?')) return;

  const result = await friendsStore.removeFriend(friendshipId);
  if (result.ok) {
    notificationsStore.addSuccessNotification('✅ Успешно', 'Друг удален');
  } else {
    notificationsStore.addErrorNotification('❌ Ошибка', result.error);
  }
};

const handleAcceptRequest = async friendshipId => {
  const result = await friendsStore.acceptFriendRequest(friendshipId);
  if (result.ok) {
    notificationsStore.addSuccessNotification('✅ Успешно', 'Запрос принят');
  } else {
    notificationsStore.addErrorNotification('❌ Ошибка', result.error);
  }
};

const handleDeclineRequest = async friendshipId => {
  const result = await friendsStore.declineFriendRequest(friendshipId);
  if (result.ok) {
    notificationsStore.addSuccessNotification('✅ Успешно', 'Запрос отклонен');
  }
};
</script>

<style scoped>
.friends-list-container {
  max-width: 800px;
  margin: 0 auto;
}

.friends-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.friends-title {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin: 0;
}

.friends-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #1f2937;
  padding: 4px;
  border-radius: 8px;
}

.tab {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-weight: 600;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  background: #374151;
  color: #d1d5db;
}

.tab.active {
  background: #3b82f6;
  color: white;
}

.friends-loading {
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

.friends-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 16px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-sm {
  font-size: 14px;
}

@media (max-width: 640px) {
  .friends-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .friends-tabs {
    flex-direction: column;
  }

  .tab {
    text-align: left;
  }
}
</style>
