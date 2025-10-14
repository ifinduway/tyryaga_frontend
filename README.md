# Тюряга - Браузерная онлайн-игра

> Версия: 1.0 MVP

Браузерная онлайн-игра "Тюряга" с кооперативной механикой боев с боссами и системой кланов.

## 🎮 Особенности игры

- **Кооперативные бои с боссами** - сражайтесь вместе с другими игроками
- **Система кланов** - создавайте братвы и работайте в команде
- **Real-time чат** - общайтесь в глобальном чате и чатах кланов
- **Система энергии** - тратьте энергию на бои и восстанавливайте её со временем
- **Прогрессия персонажа** - повышайте уровень, зарабатывайте деньги и уважение

## 🛠 Технологический стек

### Frontend

- **Nuxt.js 3** - Vue.js фреймворк
- **Vue 3** - Composition API
- **Pinia** - управление состоянием
- **TailwindCSS** - стилизация
- **Socket.io-client** - real-time коммуникация

### Backend

- **Node.js** - серверная платформа
- **Express.js** - веб-фреймворк
- **Socket.io** - real-time коммуникация
- **MongoDB** - база данных
- **Mongoose** - ODM для MongoDB
- **JWT** - аутентификация
- **bcryptjs** - хеширование паролей

## 📁 Структура проекта

```
tyuryaga_frontend/
├── client/                 # Frontend (Nuxt.js)
│   ├── assets/           # Статические ресурсы
│   ├── components/       # Vue компоненты
│   │   ├── atoms/        # Базовые компоненты
│   │   ├── molecules/    # Составные компоненты
│   │   ├── organisms/    # Сложные компоненты
│   │   └── templates/   # Шаблоны страниц
│   ├── pages/           # Страницы приложения
│   ├── stores/         # Pinia stores
│   ├── composables/    # Vue composables
│   ├── middleware/     # Middleware
│   └── plugins/       # Плагины
├── server/             # Backend (Express.js)
│   ├── src/
│   │   ├── controllers/ # Контроллеры
│   │   ├── models/     # Модели MongoDB
│   │   ├── routes/     # Маршруты API
│   │   ├── services/   # Бизнес-логика
│   │   ├── sockets/   # Socket.io обработчики
│   │   ├── middleware/ # Middleware
│   │   └── utils/     # Утилиты
│   └── env.example    # Пример переменных окружения
└── tests/             # Тесты
```

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js** версии 20.11.0 или выше
- **MongoDB** (локально или MongoDB Atlas)
- **npm** или **yarn**

### Установка и запуск

1. **Клонируйте репозиторий**

   ```bash
   git clone <repository-url>
   cd tyuryaga_frontend
   ```

2. **Установите зависимости для клиента**

   ```bash
   cd client
   npm install
   ```

3. **Установите зависимости для сервера**

   ```bash
   cd ../server
   npm install
   ```

4. **Настройте переменные окружения**

   Создайте файл `.env` в папке `server` на основе `env.example`:

   ```bash
   cp env.example .env
   ```

   Отредактируйте `.env` файл:

   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/tyuryaga
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:3000
   ```

5. **Запустите MongoDB**

   Если используете локальную MongoDB:

   ```bash
   mongod
   ```

   Или используйте MongoDB Atlas (облачная версия).

6. **Запустите сервер**

   ```bash
   cd server
   npm run dev
   ```

   Сервер будет доступен по адресу: http://localhost:3001

7. **Запустите клиент**

   ```bash
   cd client
   npm run dev
   ```

   Клиент будет доступен по адресу: http://localhost:3000

## 🎯 Основные функции

### Аутентификация

- Регистрация новых пользователей
- Вход в систему
- JWT токены для авторизации
- Защищенные маршруты

### Игровая механика

- **Энергия** - восстанавливается каждые 5 минут (+1)
- **Уровни** - повышение уровня за опыт
- **Деньги** - игровая валюта
- **Уважение** - рейтинг игрока

### Боссы

- Список всех боссов
- Активные бои в реальном времени
- Система урона и здоровья
- Распределение наград по вкладу

### Кланы

- Создание и управление кланами
- Роли участников (лидер, офицер, рядовой)
- Общий банк клана
- Чат клана

### Чат

- Глобальный чат
- Чат клана
- Real-time сообщения через Socket.io

## 🔧 API Endpoints

### Аутентификация

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/verify` - Проверка токена

### Пользователи

- `GET /api/user/me` - Профиль пользователя
- `PUT /api/user/me` - Обновление профиля
- `GET /api/user/leaderboard` - Лидерборд
- `GET /api/user/stats` - Статистика

### Боссы

- `GET /api/bosses` - Список боссов
- `GET /api/bosses/:id` - Информация о боссе
- `POST /api/bosses` - Создание босса (админ)
- `POST /api/bosses/:id/activate` - Активация босса (админ)

### Кланы

- `GET /api/clans` - Список кланов
- `POST /api/clans` - Создание клана
- `GET /api/clans/:id` - Информация о клане
- `POST /api/clans/:id/join` - Вступление в клан
- `POST /api/clans/:id/leave` - Покидание клана
- `POST /api/clans/:id/deposit` - Пополнение банка

## 🔌 Socket.io Events

### Клиент → Сервер

- `joinRoom` - Присоединение к комнате
- `leaveRoom` - Покидание комнаты
- `chatMessage` - Отправка сообщения
- `joinBoss` - Присоединение к бою с боссом
- `dealDamage` - Нанесение урона боссу

### Сервер → Клиент

- `connect` - Подключение к серверу
- `disconnect` - Отключение от сервера
- `chatHistory` - История сообщений
- `newMessage` - Новое сообщение
- `bossState` - Состояние босса
- `bossUpdate` - Обновление босса
- `bossDefeated` - Босс побежден
- `playerJoined` - Игрок присоединился к бою

## 🗄 Модели данных

### User (Пользователь)

```javascript
{
  email: String,
  passwordHash: String,
  nickname: String,
  level: Number,
  exp: Number,
  money: Number,
  respect: Number,
  energy: Number,
  items: [{ itemId, qty }],
  clanId: ObjectId,
  online: Boolean,
  lastSeen: Date
}
```

### Boss (Босс)

```javascript
{
  name: String,
  maxHp: Number,
  currentHp: Number,
  level: Number,
  rewards: { money, exp, items: [] },
  state: 'idle' | 'active' | 'dead',
  participants: [{ userId, damageDealt }]
}
```

### Clan (Клан)

```javascript
{
  name: String,
  leaderId: ObjectId,
  members: [{ userId, role }],
  bank: Number,
  level: Number,
  exp: Number
}
```

### Message (Сообщение)

```javascript
{
  room: String,
  roomId: String,
  senderId: ObjectId,
  text: String,
  messageType: String
}
```

## 🧪 Тестирование

```bash
# Запуск тестов сервера
cd server
npm test

# Запуск тестов клиента
cd client
npm test
```

## 📦 Сборка для продакшена

### Клиент

```bash
cd client
npm run build
```

### Сервер

```bash
cd server
npm start
```

## 🚀 Деплой

### Рекомендуемые платформы

**Frontend:**

- Vercel
- Netlify
- GitHub Pages

**Backend:**

- Railway
- Render
- DigitalOcean
- Heroku

**База данных:**

- MongoDB Atlas (рекомендуется)

### Переменные окружения для продакшена

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tyuryaga
JWT_SECRET=your-super-secure-jwt-secret-key
CLIENT_URL=https://your-frontend-domain.com
```

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект распространяется под лицензией MIT. См. файл `LICENSE` для подробностей.

## 🎯 Дорожная карта

### MVP (Текущая версия)

- ✅ Базовая аутентификация
- ✅ Система боссов
- ✅ Система кланов
- ✅ Real-time чат
- ✅ Базовый UI

### Планируемые функции

- [ ] Система предметов и экипировки
- [ ] Работы для заработка денег
- [ ] Система достижений
- [ ] Лидерборды
- [ ] Мобильная версия
- [ ] Система уведомлений
- [ ] Админ панель
- [ ] Система событий

## 🐛 Известные проблемы

- При перезагрузке страницы Socket.io соединение может не восстановиться автоматически
- Нет валидации на клиенте для некоторых форм
- Отсутствует система восстановления пароля

## 📞 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте [Issues](https://github.com/your-repo/issues)
2. Создайте новый Issue с подробным описанием проблемы
3. Приложите логи ошибок и скриншоты

---

**Удачной игры в Тюряге! 🎮**
