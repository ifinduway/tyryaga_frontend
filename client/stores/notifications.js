import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([]);
  let notificationIdCounter = 0;

  // Добавить уведомление
  const addNotification = ({
    type = 'info',
    title,
    message,
    duration = 10000,
    data = null
  }) => {
    const id = ++notificationIdCounter;

    const notification = {
      id,
      type, // 'info', 'success', 'warning', 'error', 'friendRequest', 'bossInvitation'
      title,
      message,
      data,
      createdAt: Date.now()
    };

    notifications.value.push(notification);

    // Автоматически удаляем через duration миллисекунд
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  // Удалить уведомление
  const removeNotification = id => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  // Добавить уведомление о запросе в друзья
  const addFriendRequestNotification = requestData => {
    return addNotification({
      type: 'friendRequest',
      title: '👥 Запрос в друзья',
      message: `${requestData.from.nickname} (ур. ${requestData.from.level}) хочет добавить вас в друзья`,
      data: requestData,
      duration: 15000 // 15 секунд
    });
  };

  // Добавить уведомление о принятии запроса в друзья
  const addFriendAcceptedNotification = friendData => {
    return addNotification({
      type: 'success',
      title: '✅ Заявка принята',
      message: `${friendData.nickname} (ур. ${friendData.level}) принял вашу заявку в друзья!`,
      data: friendData,
      duration: 8000
    });
  };

  // Добавить уведомление о приглашении в бой
  const addBossInvitationNotification = invitationData => {
    return addNotification({
      type: 'bossInvitation',
      title: '⚔️ Приглашение в бой',
      message: `${invitationData.from.nickname} приглашает вас на ${invitationData.instance.bossName} (ур. ${invitationData.instance.bossLevel})`,
      data: invitationData,
      duration: 20000 // 20 секунд
    });
  };

  // Добавить успешное уведомление
  const addSuccessNotification = (title, message, duration = 5000) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  };

  // Добавить уведомление об ошибке
  const addErrorNotification = (title, message, duration = 8000) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration
    });
  };

  // Очистить все уведомления
  const clearAllNotifications = () => {
    notifications.value = [];
  };

  return {
    // State
    notifications,

    // Actions
    addNotification,
    removeNotification,
    addFriendRequestNotification,
    addFriendAcceptedNotification,
    addBossInvitationNotification,
    addSuccessNotification,
    addErrorNotification,
    clearAllNotifications
  };
});
