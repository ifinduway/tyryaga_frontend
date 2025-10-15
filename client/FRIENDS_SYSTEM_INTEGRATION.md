# 🤝 Интеграция системы друзей и приватных инстансов

## ✅ Реализованные компоненты

### Stores

- ✅ `stores/friends.js` - управление друзьями
- ✅ `stores/notifications.js` - система уведомлений

### Компоненты

- ✅ `components/molecules/NotificationToast.vue` - уведомление
- ✅ `components/molecules/FriendCard.vue` - карточка друга
- ✅ `components/organisms/NotificationContainer.vue` - контейнер уведомлений
- ✅ `components/organisms/FriendsList.vue` - список друзей
- ✅ `components/organisms/AddFriendModal.vue` - добавить друга
- ✅ `components/organisms/InviteFriendsModal.vue` - пригласить в бой

### Страницы

- ✅ `pages/friends.vue` - страница друзей
- ✅ `pages/bosses/index.vue` - обновлена (приватные инстансы)

## 📋 Что нужно сделать

### 1. Добавить NotificationContainer в app.vue

```vue
<template>
  <div>
    <!-- Основной контент -->
    <NuxtPage />

    <!-- Контейнер уведомлений -->
    <NotificationContainer />
  </div>
</template>

<script setup>
import NotificationContainer from '~/components/organisms/NotificationContainer.vue';
</script>
```

### 2. Подключить Socket.io слушатели для друзей

Создать файл `plugins/socket-friends.client.js`:

```javascript
import { io } from 'socket.io-client';

export default defineNuxtPlugin(nuxtApp => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const friendsStore = useFriendsStore();
  const notificationsStore = useNotificationsStore();

  if (!authStore.token) return;

  const socket = io(config.public.wsUrl, {
    auth: {
      token: authStore.token
    }
  });

  // Запрос в друзья получен
  socket.on('friendRequestReceived', data => {
    friendsStore.addIncomingRequestFromSocket(data);
    notificationsStore.addFriendRequestNotification(data);
  });

  // Запрос в друзья принят
  socket.on('friendRequestAccepted', data => {
    friendsStore.addFriendFromSocket(data.friend);
    notificationsStore.addFriendAcceptedNotification(data.friend);
  });

  // Приглашение в бой
  socket.on('bossInvitationReceived', data => {
    notificationsStore.addBossInvitationNotification(data);
  });

  // Сохраняем socket в nuxtApp для использования в других местах
  nuxtApp.provide('socket', socket);
});
```

### 3. Добавить кнопку "Пригласить друзей" на странице босса

В `pages/bosses/[id].vue` добавить:

```vue
<!-- В секции с информацией о боссе -->
<button
  v-if="instance?.isOwner && instance?.isPrivate"
  @click="showInviteFriendsModal = true"
  class="btn-primary"
>
  👥 Пригласить друзей
</button>

<!-- Модальное окно -->
<InviteFriendsModal
  v-if="showInviteFriendsModal"
  :instance-id="instanceId"
  @close="showInviteFriendsModal = false"
/>
```

### 4. Добавить ссылку на страницу друзей в навигацию

В главном меню добавить:

```vue
<NuxtLink to="/friends" class="nav-link">
  👥 Друзья
</NuxtLink>
```

## 🧪 Тестирование

### Сценарий 1: Добавление друга

1. Перейти на `/friends`
2. Нажать "Добавить друга"
3. Ввести никнейм
4. Проверить уведомление
5. У друга должно появиться уведомление

### Сценарий 2: Создание приватного боя

1. Перейти на `/bosses`
2. Выбрать босса
3. Отметить "Приватный бой"
4. Создать инстанс
5. Нажать "Пригласить друзей"
6. Выбрать друга
7. У друга должно появиться уведомление

### Сценарий 3: Присоединение к приватному бою

1. Получить приглашение
2. Нажать "Присоединиться" в уведомлении
3. Перейти на страницу боя
4. Начать атаковать босса

## 🔍 Проверка функционала

- [ ] Отправка запроса в друзья работает
- [ ] Уведомления о запросах приходят в реальном времени
- [ ] Принятие/отклонение запросов работает
- [ ] Создание приватного инстанса работает
- [ ] Приглашение друзей в бой работает
- [ ] Уведомления о приглашениях приходят
- [ ] Присоединение к приватному бою работает
- [ ] Приватные бои видны только друзьям

## 📚 API Endpoints

См. `server/FRIENDS_AND_PRIVATE_INSTANCES_API.md` для полной документации API.

## 🐛 Известные проблемы

_Пока нет_

## 🚀 Следующие шаги

1. Добавить страницу профиля с вкладкой друзей
2. Добавить счетчик входящих запросов в друзья
3. Добавить фильтрацию друзей по статусу (онлайн/оффлайн)
4. Добавить личные сообщения между друзьями

---

Готово к тестированию! 🎉
