# API Documentation: Friends & Private Boss Instances

## 🤝 Friends System API

### POST `/api/friends/request`

Отправить запрос в друзья

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "targetNickname": "player123"
}
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "friendship": {
      "id": "friendship_id",
      "from": {
        "userId": "user_id",
        "nickname": "sender",
        "level": 25
      },
      "to": {
        "userId": "target_id",
        "nickname": "player123",
        "level": 30
      },
      "status": "pending",
      "createdAt": "2025-01-15T12:00:00.000Z"
    }
  }
}
```

**Errors:**

- `404` - Пользователь не найден
- `400` - Нельзя добавить самого себя / Вы уже друзья / Запрос уже отправлен

---

### GET `/api/friends`

Получить список друзей и запросов

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` (optional): `'accepted' | 'pending' | 'all'`

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "friends": [
      {
        "friendshipId": "friendship_id",
        "userId": "friend_id",
        "nickname": "friend123",
        "level": 35,
        "status": "accepted",
        "createdAt": "2025-01-10T12:00:00.000Z",
        "acceptedAt": "2025-01-10T12:05:00.000Z"
      }
    ],
    "incomingRequests": [
      {
        "friendshipId": "request_id",
        "userId": "sender_id",
        "nickname": "newplayer",
        "level": 5,
        "status": "pending",
        "createdAt": "2025-01-15T11:00:00.000Z"
      }
    ],
    "outgoingRequests": [
      {
        "friendshipId": "request_id",
        "userId": "target_id",
        "nickname": "player456",
        "level": 20,
        "status": "pending",
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

### POST `/api/friends/:id/accept`

Принять запрос в друзья

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "friendship": {
      "id": "friendship_id",
      "friend": {
        "userId": "friend_id",
        "nickname": "friend123",
        "level": 25
      },
      "acceptedAt": "2025-01-15T12:00:00.000Z"
    }
  }
}
```

**Errors:**

- `404` - Запрос не найден
- `403` - Нет доступа к этому запросу
- `400` - Запрос уже обработан

---

### POST `/api/friends/:id/decline`

Отклонить запрос в друзья

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "message": "Запрос отклонен"
  }
}
```

**Errors:**

- `404` - Запрос не найден
- `403` - Нет доступа к этому запросу

---

### DELETE `/api/friends/:id`

Удалить из друзей

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "message": "Друг удален"
  }
}
```

**Errors:**

- `404` - Дружба не найдена
- `403` - Нет доступа к этой дружбе

---

## 🔒 Private Boss Instances API

### POST `/api/boss/instance/create`

Создать новый инстанс босса (публичный или приватный)

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "templateId": "boss_template_id",
  "isPrivate": false
}
```

**Response (201):**

```json
{
  "ok": true,
  "data": {
    "instance": {
      "id": "instance_id",
      "templateId": "boss_template_id",
      "templateName": "Смотрящий",
      "templateLevel": 30,
      "rewards": {
        "money": 1000,
        "exp": 100
      },
      "currentHp": 500,
      "maxHp": 500,
      "expiresAt": "2025-01-15T12:30:00.000Z",
      "createdAt": "2025-01-15T12:00:00.000Z",
      "participants": [
        {
          "userId": "owner_id",
          "damageDealt": 0,
          "joinedAt": "2025-01-15T12:00:00.000Z"
        }
      ]
    }
  }
}
```

**Errors:**

- `400` - У вас уже есть активный инстанс / ID шаблона обязателен
- `404` - Шаблон босса не найден или неактивен
- `403` - Требуется уровень X

---

### POST `/api/boss/instance/:id/invite`

Пригласить друга в приватный бой

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "friendId": "friend_user_id"
}
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "message": "Игрок приглашен",
    "invitation": {
      "instanceId": "instance_id",
      "friend": {
        "userId": "friend_id",
        "nickname": "friend123",
        "level": 35
      },
      "bossName": "Смотрящий",
      "bossLevel": 30
    }
  }
}
```

**Errors:**

- `400` - ID друга обязателен / Этот инстанс публичный / Инстанс недоступен / Этот игрок уже участвует / Этот игрок уже приглашен
- `404` - Инстанс не найден
- `403` - Только владелец может приглашать / Можно приглашать только друзей

---

### GET `/api/boss/instance/available`

Получить список доступных инстансов (публичные + приватные инстансы друзей)

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `limit` (optional, default: 20): количество результатов

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "publicInstances": [
      {
        "id": "instance_id",
        "templateName": "Смотрящий",
        "templateLevel": 30,
        "ownerNickname": "player123",
        "ownerLevel": 35,
        "currentHp": 450,
        "maxHp": 500,
        "participantCount": 2,
        "isPrivate": false,
        "expiresAt": "2025-01-15T12:30:00.000Z",
        "createdAt": "2025-01-15T12:00:00.000Z"
      }
    ],
    "friendsPrivateInstances": [
      {
        "id": "instance_id",
        "templateName": "Древний дракон",
        "templateLevel": 50,
        "ownerNickname": "bestfriend",
        "ownerLevel": 55,
        "currentHp": 1000,
        "maxHp": 2000,
        "participantCount": 1,
        "isPrivate": true,
        "expiresAt": "2025-01-15T13:00:00.000Z",
        "createdAt": "2025-01-15T12:30:00.000Z"
      }
    ]
  }
}
```

---

## 📡 Socket.io Events

### Server → Client

#### `friendRequestReceived`

Получено приглашение в друзья

**Payload:**

```javascript
{
  requestId: 'friendship_id',
  from: {
    userId: 'sender_id',
    nickname: 'sender_nickname',
    level: 25
  }
}
```

---

#### `friendRequestAccepted`

Ваш запрос в друзья принят

**Payload:**

```javascript
{
  friend: {
    userId: 'friend_id',
    nickname: 'friend_nickname',
    level: 30
  }
}
```

---

#### `bossInvitationReceived`

Получено приглашение в приватный бой с боссом

**Payload:**

```javascript
{
  invitationId: 'instance_id',
  from: {
    userId: 'owner_id',
    nickname: 'owner_nickname'
  },
  instance: {
    id: 'instance_id',
    bossName: 'Смотрящий',
    bossLevel: 30,
    currentHp: 500,
    maxHp: 500,
    expiresAt: '2025-01-15T12:30:00.000Z'
  }
}
```

---

## 🔐 Access Control

### Публичные инстансы

- Видны всем игрокам
- Любой может присоединиться

### Приватные инстансы

- Видны только:
  - Владельцу
  - Друзьям владельца
  - Приглашенным игрокам
- Присоединиться могут только приглашенные

### Права владельца приватного инстанса

- ✅ Приглашать друзей в любое время
- ❌ Кикнуть участника (нельзя)
- ❌ Отозвать приглашение (нельзя)
- ❌ Передать права (нельзя)
- ❌ Изменить тип инстанса после создания (нельзя)

---

## 🧪 Примеры использования

### Сценарий 1: Добавление друга и приглашение в бой

```javascript
// 1. Отправляем запрос в друзья
const friendRequest = await fetch('/api/friends/request', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ targetNickname: 'bestfriend' })
});

// 2. Друг получает уведомление через Socket.io
socket.on('friendRequestReceived', data => {
  console.log(`Запрос в друзья от ${data.from.nickname}`);
});

// 3. Друг принимает запрос
const acceptance = await fetch(`/api/friends/${requestId}/accept`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});

// 4. Вы получаете уведомление
socket.on('friendRequestAccepted', data => {
  console.log(`${data.friend.nickname} принял вашу заявку!`);
});

// 5. Создаем приватный инстанс
const instance = await fetch('/api/boss/instance/create', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    templateId: 'boss_id',
    isPrivate: true
  })
});

// 6. Приглашаем друга
const invitation = await fetch(`/api/boss/instance/${instanceId}/invite`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ friendId: 'friend_id' })
});

// 7. Друг получает приглашение
socket.on('bossInvitationReceived', data => {
  console.log(
    `Приглашение в бой: ${data.instance.bossName} от ${data.from.nickname}`
  );
});
```

---

Готово! 🚀
