import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useFriendsStore = defineStore('friends', () => {
  const friends = ref([]);
  const incomingRequests = ref([]);
  const outgoingRequests = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Computed
  const friendsCount = computed(() => friends.value.length);
  const incomingRequestsCount = computed(() => incomingRequests.value.length);
  const outgoingRequestsCount = computed(() => outgoingRequests.value.length);

  // Загрузить список друзей
  const loadFriends = async () => {
    loading.value = true;
    error.value = null;

    try {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();

      const response = await fetch(`${config.public.apiBase}/api/friends`, {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      });

      const data = await response.json();

      if (data.ok) {
        friends.value = data.data.friends || [];
        incomingRequests.value = data.data.incomingRequests || [];
        outgoingRequests.value = data.data.outgoingRequests || [];
      } else {
        error.value = data.error || 'Ошибка загрузки друзей';
      }
    } catch (err) {
      console.error('Ошибка загрузки друзей:', err);
      error.value = 'Ошибка загрузки друзей';
    } finally {
      loading.value = false;
    }
  };

  // Отправить запрос в друзья
  const sendFriendRequest = async targetNickname => {
    loading.value = true;
    error.value = null;

    try {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();

      const response = await fetch(
        `${config.public.apiBase}/api/friends/request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.token}`
          },
          body: JSON.stringify({ targetNickname })
        }
      );

      const data = await response.json();

      if (data.ok) {
        // Добавляем в исходящие запросы
        outgoingRequests.value.push({
          friendshipId: data.data.friendship.id,
          userId: data.data.friendship.to.userId,
          nickname: data.data.friendship.to.nickname,
          level: data.data.friendship.to.level,
          status: 'pending',
          createdAt: data.data.friendship.createdAt
        });
        return { ok: true };
      } else {
        error.value = data.error || 'Ошибка отправки запроса';
        return { ok: false, error: data.error };
      }
    } catch (err) {
      console.error('Ошибка отправки запроса в друзья:', err);
      error.value = 'Ошибка отправки запроса';
      return { ok: false, error: 'Ошибка отправки запроса' };
    } finally {
      loading.value = false;
    }
  };

  // Принять запрос в друзья
  const acceptFriendRequest = async friendshipId => {
    loading.value = true;
    error.value = null;

    try {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();

      const response = await fetch(
        `${config.public.apiBase}/api/friends/${friendshipId}/accept`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      );

      const data = await response.json();

      if (data.ok) {
        // Удаляем из входящих запросов
        const requestIndex = incomingRequests.value.findIndex(
          r => r.friendshipId === friendshipId
        );
        if (requestIndex !== -1) {
          const request = incomingRequests.value[requestIndex];
          incomingRequests.value.splice(requestIndex, 1);

          // Добавляем в друзья
          friends.value.push({
            friendshipId: data.data.friendship.id,
            userId: data.data.friendship.friend.userId,
            nickname: data.data.friendship.friend.nickname,
            level: data.data.friendship.friend.level,
            status: 'accepted',
            acceptedAt: data.data.friendship.acceptedAt
          });
        }
        return { ok: true };
      } else {
        error.value = data.error || 'Ошибка принятия запроса';
        return { ok: false, error: data.error };
      }
    } catch (err) {
      console.error('Ошибка принятия запроса:', err);
      error.value = 'Ошибка принятия запроса';
      return { ok: false, error: 'Ошибка принятия запроса' };
    } finally {
      loading.value = false;
    }
  };

  // Отклонить запрос в друзья
  const declineFriendRequest = async friendshipId => {
    loading.value = true;
    error.value = null;

    try {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();

      const response = await fetch(
        `${config.public.apiBase}/api/friends/${friendshipId}/decline`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      );

      const data = await response.json();

      if (data.ok) {
        // Удаляем из входящих запросов
        const requestIndex = incomingRequests.value.findIndex(
          r => r.friendshipId === friendshipId
        );
        if (requestIndex !== -1) {
          incomingRequests.value.splice(requestIndex, 1);
        }
        return { ok: true };
      } else {
        error.value = data.error || 'Ошибка отклонения запроса';
        return { ok: false, error: data.error };
      }
    } catch (err) {
      console.error('Ошибка отклонения запроса:', err);
      error.value = 'Ошибка отклонения запроса';
      return { ok: false, error: 'Ошибка отклонения запроса' };
    } finally {
      loading.value = false;
    }
  };

  // Удалить из друзей
  const removeFriend = async friendshipId => {
    loading.value = true;
    error.value = null;

    try {
      const config = useRuntimeConfig();
      const authStore = useAuthStore();

      const response = await fetch(
        `${config.public.apiBase}/api/friends/${friendshipId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        }
      );

      const data = await response.json();

      if (data.ok) {
        // Удаляем из друзей
        const friendIndex = friends.value.findIndex(
          f => f.friendshipId === friendshipId
        );
        if (friendIndex !== -1) {
          friends.value.splice(friendIndex, 1);
        }
        return { ok: true };
      } else {
        error.value = data.error || 'Ошибка удаления друга';
        return { ok: false, error: data.error };
      }
    } catch (err) {
      console.error('Ошибка удаления друга:', err);
      error.value = 'Ошибка удаления друга';
      return { ok: false, error: 'Ошибка удаления друга' };
    } finally {
      loading.value = false;
    }
  };

  // Добавить друга из Socket.io события
  const addFriendFromSocket = friendData => {
    const exists = friends.value.some(f => f.userId === friendData.userId);
    if (!exists) {
      friends.value.push({
        friendshipId: friendData.friendshipId || null,
        userId: friendData.userId,
        nickname: friendData.nickname,
        level: friendData.level,
        status: 'accepted',
        acceptedAt: friendData.acceptedAt || new Date()
      });
    }
  };

  // Добавить входящий запрос из Socket.io события
  const addIncomingRequestFromSocket = requestData => {
    const exists = incomingRequests.value.some(
      r => r.userId === requestData.from.userId
    );
    if (!exists) {
      incomingRequests.value.push({
        friendshipId: requestData.requestId,
        userId: requestData.from.userId,
        nickname: requestData.from.nickname,
        level: requestData.from.level,
        status: 'pending',
        createdAt: new Date()
      });
    }
  };

  // Очистить все данные
  const clearFriends = () => {
    friends.value = [];
    incomingRequests.value = [];
    outgoingRequests.value = [];
    error.value = null;
  };

  return {
    // State
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error,

    // Computed
    friendsCount,
    incomingRequestsCount,
    outgoingRequestsCount,

    // Actions
    loadFriends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    addFriendFromSocket,
    addIncomingRequestFromSocket,
    clearFriends
  };
});
