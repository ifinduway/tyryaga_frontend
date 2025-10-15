import { io } from 'socket.io-client';

export default defineNuxtPlugin(nuxtApp => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const friendsStore = useFriendsStore();
  const notificationsStore = useNotificationsStore();

  // Не подключаемся если пользователь не авторизован
  if (!authStore.isAuthenticated || !authStore.token) {
    console.log('👥 Socket Friends: Пользователь не авторизован, пропускаем подключение');
    return;
  }

  console.log('👥 Подключаем Socket.io для системы друзей...');

  const socket = io(config.public.wsUrl, {
    auth: {
      token: authStore.token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✅ Socket Friends подключен');
  });

  socket.on('disconnect', reason => {
    console.log('❌ Socket Friends отключен:', reason);
  });

  socket.on('reconnect', attemptNumber => {
    console.log(`🔄 Socket Friends переподключен после ${attemptNumber} попыток`);
  });

  // Получен запрос в друзья
  socket.on('friendRequestReceived', data => {
    console.log('📩 Получен запрос в друзья:', data);
    friendsStore.addIncomingRequestFromSocket(data);
    notificationsStore.addFriendRequestNotification(data);
  });

  // Запрос в друзья принят
  socket.on('friendRequestAccepted', data => {
    console.log('✅ Ваш запрос в друзья принят:', data);
    friendsStore.addFriendFromSocket(data.friend);
    notificationsStore.addFriendAcceptedNotification(data.friend);
  });

  // Получено приглашение в бой с боссом
  socket.on('bossInvitationReceived', data => {
    console.log('⚔️ Получено приглашение в бой:', data);
    notificationsStore.addBossInvitationNotification(data);
  });

  // Сохраняем socket в nuxtApp для использования в других местах
  nuxtApp.provide('friendsSocket', socket);

  // Очистка при размонтировании
  nuxtApp.hook('app:unmounted', () => {
    if (socket) {
      socket.disconnect();
      console.log('👋 Socket Friends отключен при размонтировании приложения');
    }
  });
});

