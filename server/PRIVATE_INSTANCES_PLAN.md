# План реализации приватных инстансов и системы друзей

## 📋 Требования

На основе ответов пользователя:

### Система друзей

- ✅ Создать полную систему друзей
- ✅ Список друзей обязателен
- ✅ Запросы в друзья с подтверждением

### Механика приглашений

- ✅ Отправка приглашения (друг получает уведомление)
- ✅ Друг может принять/отклонить

### Видимость приватных инстансов

- ✅ Показывать только друзьям
- ✅ Не показывать в публичном списке

### Ограничения

- ✅ Без ограничений на количество участников
- ✅ Приглашать можно в любое время (даже во время боя)
- ❌ Нельзя изменить тип инстанса после создания

### Уведомления

- ✅ Всплывающие уведомления в игре

### Управление доступом

- ❌ Нельзя кикнуть участника
- ❌ Нельзя отозвать приглашение
- ❌ Нельзя передать права владельца

---

## 🏗️ Архитектура

### 1. Модель Friend (Mongoose)

```javascript
{
  userId: ObjectId,           // Кто отправил запрос
  friendId: ObjectId,         // Кому отправлен запрос
  status: String,             // 'pending', 'accepted', 'declined'
  createdAt: Date,
  acceptedAt: Date
}
```

**Индексы:**

- `userId + friendId` (unique)
- `userId + status`
- `friendId + status`

### 2. Обновление модели BossInstance

Добавить поля:

```javascript
{
  isPrivate: {
    type: Boolean,
    default: false
  },
  invitedPlayers: [{
    userId: ObjectId,
    invitedAt: Date,
    status: String        // 'pending', 'accepted', 'declined'
  }]
}
```

### 3. Модель Notification (новая)

```javascript
{
  userId: ObjectId,           // Кому уведомление
  type: String,               // 'friendRequest', 'bossInvitation', etc.
  from: ObjectId,             // От кого
  data: Mixed,                // Дополнительные данные
  isRead: Boolean,
  createdAt: Date
}
```

---

## 🔧 Backend Implementation

### 1. API Endpoints - Система друзей

#### `POST /api/friends/request`

Отправить запрос в друзья

```javascript
body: { targetNickname: string }
response: { ok: true, friendship: {...} }
```

#### `GET /api/friends`

Получить список друзей

```javascript
query: { status: 'accepted' | 'pending' | 'all' }
response: { ok: true, friends: [...] }
```

#### `POST /api/friends/:id/accept`

Принять запрос в друзья

```javascript
response: {
  ok: true;
}
```

#### `POST /api/friends/:id/decline`

Отклонить запрос в друзья

```javascript
response: {
  ok: true;
}
```

#### `DELETE /api/friends/:id`

Удалить из друзей

```javascript
response: {
  ok: true;
}
```

### 2. API Endpoints - Приватные инстансы

#### `POST /api/boss/instance/create`

Обновить существующий endpoint

```javascript
body: {
  templateId: string,
  isPrivate: boolean
}
```

#### `POST /api/boss/instance/:id/invite`

Пригласить друга в приватный бой

```javascript
body: {
  friendId: string;
}
response: {
  ok: true;
}
```

#### `GET /api/boss/instance/available`

Обновить: показывать приватные инстансы друзей

```javascript
response: {
  publicInstances: [...],
  friendsPrivateInstances: [...]
}
```

### 3. Socket.io Events

#### Server → Client

**`friendRequestReceived`**

```javascript
{
  requestId: string,
  from: {
    userId: string,
    nickname: string,
    level: number
  }
}
```

**`friendRequestAccepted`**

```javascript
{
  friend: {
    userId: string,
    nickname: string,
    level: number
  }
}
```

**`bossInvitationReceived`**

```javascript
{
  invitationId: string,
  from: {
    userId: string,
    nickname: string
  },
  instance: {
    id: string,
    bossName: string,
    bossLevel: number
  }
}
```

#### Client → Server

**`acceptFriendRequest`**

```javascript
{
  requestId: string;
}
```

**`declineFriendRequest`**

```javascript
{
  requestId: string;
}
```

**`acceptBossInvitation`**

```javascript
{
  invitationId: string;
}
```

**`declineBossInvitation`**

```javascript
{
  invitationId: string;
}
```

---

## 🎨 Frontend Implementation

### 1. Компоненты

#### `FriendsList.vue`

Список друзей с вкладками:

- Друзья (accepted)
- Входящие запросы (pending incoming)
- Исходящие запросы (pending outgoing)

#### `AddFriendModal.vue`

Модальное окно для отправки запроса в друзья

#### `InviteFriendsModal.vue`

Модальное окно для приглашения друзей в бой

#### `NotificationToast.vue`

Всплывающее уведомление

### 2. Store: `friends.js`

```javascript
{
  friends: [],              // Список друзей
  incomingRequests: [],     // Входящие запросы
  outgoingRequests: [],     // Исходящие запросы

  actions: {
    loadFriends(),
    sendRequest(nickname),
    acceptRequest(id),
    declineRequest(id),
    removeFriend(id)
  }
}
```

### 3. Store: `notifications.js`

```javascript
{
  notifications: [],        // Массив активных уведомлений

  actions: {
    addNotification(data),
    removeNotification(id)
  }
}
```

### 4. UI Changes

#### `/profile` - добавить вкладку "Друзья"

```
┌──────────────────────────────────────┐
│  Профиль  │  Друзья*  │  Инвентарь  │
├──────────────────────────────────────┤
│  👥 Мои друзья (5)                   │
│  ────────────────────────────────    │
│  • fuway (ур. 25) [Удалить]          │
│  • player2 (ур. 30) [Удалить]        │
│                                      │
│  📩 Входящие запросы (2)             │
│  ────────────────────────────────    │
│  • newbie (ур. 5)                    │
│    [✅ Принять] [❌ Отклонить]        │
│                                      │
│  [➕ Добавить друга]                 │
└──────────────────────────────────────┘
```

#### `/bosses/index.vue` - чекбокс приватности

```
┌──────────────────────────────────────┐
│  Создать инстанс: Смотрящий          │
├──────────────────────────────────────┤
│  ☐ Приватный бой (только с друзьями) │
│                                      │
│  [Создать]  [Отмена]                 │
└──────────────────────────────────────┘
```

#### `/bosses/[id].vue` - кнопка приглашения

```
┌──────────────────────────────────────┐
│  👹 Смотрящий  🔒 Приватный          │
│  👑 Вы владелец                      │
├──────────────────────────────────────┤
│  [👥 Пригласить друзей]              │
│                                      │
│  Участники (1/∞):                    │
│  • fuway (владелец) - 150 урона      │
│                                      │
│  Приглашены:                         │
│  • friend1 (ожидает ответа)          │
└──────────────────────────────────────┘
```

#### Всплывающее уведомление

```
┌──────────────────────────────────────┐
│  🎮 Приглашение в бой!               │
│  ────────────────────────────────    │
│  fuway приглашает вас на:            │
│  👹 Смотрящий (ур. 30)               │
│                                      │
│  [✅ Принять] [❌ Отклонить] [×]      │
└──────────────────────────────────────┘
```

---

## 🔄 Процесс взаимодействия

### 1. Добавление в друзья

```
1. User A → Ищет User B по никнейму
2. User A → Отправляет запрос в друзья
3. Server → Сохраняет Friendship (status: pending)
4. Socket.io → friendRequestReceived → User B
5. User B → Видит уведомление
6. User B → Принимает запрос
7. Server → Обновляет Friendship (status: accepted)
8. Socket.io → friendRequestAccepted → User A
9. ✅ Теперь они друзья!
```

### 2. Создание и присоединение к приватному бою

```
1. User A → Создает приватный инстанс босса
2. User A → Видит кнопку "Пригласить друзей"
3. User A → Открывает модалку, видит список друзей
4. User A → Приглашает User B
5. Server → Добавляет в invitedPlayers
6. Socket.io → bossInvitationReceived → User B
7. User B → Видит всплывающее уведомление
8. User B → Принимает приглашение
9. Server → Добавляет User B в participants
10. Socket.io → playerJoined → всем в комнате
11. ✅ User B присоединился к бою!
```

---

## 📁 Файловая структура

### Backend

```
server/src/
├── models/
│   ├── Friend.js           ✨ новый
│   ├── Notification.js     ✨ новый
│   └── BossInstance.js     🔄 обновить
├── routes/
│   ├── friend.js           ✨ новый
│   └── bossInstance.js     🔄 обновить
└── sockets/
    └── socketHandlers.js   🔄 обновить
```

### Frontend

```
client/
├── components/
│   ├── molecules/
│   │   ├── NotificationToast.vue    ✨ новый
│   │   └── FriendCard.vue           ✨ новый
│   └── organisms/
│       ├── FriendsList.vue          ✨ новый
│       ├── AddFriendModal.vue       ✨ новый
│       └── InviteFriendsModal.vue   ✨ новый
├── stores/
│   ├── friends.js          ✨ новый
│   └── notifications.js    ✨ новый
└── pages/
    ├── bosses/
    │   ├── index.vue       🔄 обновить
    │   └── [id].vue        🔄 обновить
    └── profile.vue         🔄 обновить
```

---

## 🧪 Тестовые сценарии

### 1. Система друзей

- [x] Отправить запрос несуществующему пользователю → ошибка
- [x] Отправить запрос самому себе → ошибка
- [x] Отправить повторный запрос → ошибка
- [x] Принять запрос → статус updated
- [x] Отклонить запрос → запись удалена
- [x] Удалить из друзей → запись удалена

### 2. Приватные инстансы

- [x] Создать приватный инстанс → isPrivate: true
- [x] Приватный инстанс не виден в публичном списке
- [x] Приватный инстанс виден друзьям
- [x] Пригласить не друга → ошибка
- [x] Пригласить друга → уведомление получено
- [x] Принять приглашение → присоединение к бою

### 3. Уведомления

- [x] Запрос в друзья → уведомление получено
- [x] Приглашение в бой → уведомление получено
- [x] Уведомления автоматически скрываются через 10 сек
- [x] Можно закрыть уведомление вручную

---

## 📊 Оценка времени

### Backend

- Friend модель и API: 2-3 часа
- Notification модель: 1 час
- BossInstance обновление: 1 час
- Socket.io события: 1-2 часа
  **Итого Backend: 5-7 часов**

### Frontend

- Компоненты друзей: 3-4 часа
- Notification система: 2 часа
- Обновление страниц боссов: 2 часа
- Stores: 1-2 часа
  **Итого Frontend: 8-10 часов**

### Тестирование

- Функциональное: 2-3 часа
- Интеграционное: 1-2 часа
  **Итого тестирование: 3-5 часов**

**ОБЩАЯ ОЦЕНКА: 16-22 часа**

---

## 🚀 Порядок реализации

### Фаза 1: Система друзей (Backend)

1. Создать модель Friend
2. API endpoints для друзей
3. Socket.io события для запросов

### Фаза 2: Система друзей (Frontend)

1. Store friends.js
2. Компоненты FriendsList, AddFriendModal
3. Обновить страницу профиля

### Фаза 3: Приватные инстансы (Backend)

1. Обновить модель BossInstance
2. Обновить API создания инстанса
3. API для приглашений
4. Socket.io события для приглашений

### Фаза 4: Приватные инстансы (Frontend)

1. Чекбокс приватности при создании
2. InviteFriendsModal компонент
3. Обновить список доступных инстансов
4. Кнопка "Пригласить друзей"

### Фаза 5: Уведомления

1. Store notifications.js
2. NotificationToast компонент
3. Интеграция с Socket.io

### Фаза 6: Тестирование и доработка

1. Функциональное тестирование
2. Исправление багов
3. Документация

---

## 📝 Примечания

- Друзья хранятся в двустороннем формате (две записи: A→B и B→A)
- Приватные инстансы не индексируются в публичном поиске
- Уведомления хранятся в памяти (не в БД) для производительности
- Socket.io комнаты используются для таргетированных уведомлений

---

Готово к реализации! 🎯
