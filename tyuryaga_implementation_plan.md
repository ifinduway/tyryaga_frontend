# Тюряга — подробный план реализации (MD)

> Версия: 1.0

## Содержание

1. Введение
2. Стек и общая архитектура
3. Структура проекта
4. Модели БД (MongoDB / Mongoose)
5. REST API — эндпоинты (пример)
6. Socket.io — события и комнаты
7. Модуль босс-боёв (кооператив)
8. Модуль братвы (кланов)
9. Frontend (Vue) — структура и ключевые компоненты
10. Игровая логика и механики
11. MVP — список фич и спринты (4 недели)
12. Тестирование и мониторинг
13. Деплой и инфраструктура
14. Кодстайл и соглашения
15. Дальше — возможные расширения

---

## 1. Введение

Этот документ — пошаговое руководство по созданию браузерной онлайн-игры «Тюряга» с кооперативной механикой (совместные бои с боссами).
Цель — получить готовую к запуску MVP и дорожную карту дальнейшего развития.

## 2. Стек и общая архитектура

- Frontend: **Vue 3** + Vite + **Pinia** (state) + **Vue Router**
- UI: TailwindCSS (или Vuetify/Quasar) — Tailwind рекомендую для гибкости
- Real-time: **socket.io-client**
- Backend: **Node.js** + **Express** + **Socket.io**
- БД: **MongoDB** (Atlas) + **Mongoose**
- Аутентификация: **JWT** + bcrypt
- Хостинг: Render / Railway / DigitalOcean

Архитектура: клиент ↔ REST (операции CRUD, авторизация, магазин) и клиент ↔ Socket.io (чат, босс‑сессии, нотификации).

## 3. Структура проекта (рекомендуемая)

```
/client
  /src
    /components
    /views
    /stores (pinia)
    /router
    /services (api wrappers, socket wrapper)
    main.js
/server
  /src
    /controllers
    /models
    /routes
    /services
    /sockets
    /utils
  app.js
  socket.js
/tests
README.md
```

## 4. Модели БД (MongoDB / Mongoose)

Привожу минимальные схемы, расширяй при необходимости.

```js
// User
{
  _id,
  email,
  passwordHash,
  nickname,
  level: Number,
  exp: Number,
  money: Number,
  respect: Number,
  energy: Number,
  items: [{ itemId, qty }],
  clanId: ObjectId | null,
  online: Boolean,
  lastSeen: Date
}

// Boss
{
  _id,
  name,
  maxHp: Number,
  currentHp: Number,
  level: Number,
  rewards: { money, exp, items: [] },
  spawnAt: Date | null, // для планирования
  state: 'idle' | 'active' | 'dead'
}

// Clan
{
  _id,
  name,
  leaderId,
  members: [{ userId, role }],
  bank: Number,
  createdAt: Date
}

// Message
{
  _id,
  room: String, // global, clan_<id>, boss_<id>
  senderId,
  text,
  createdAt: Date
}
```

## 5. REST API — ключевые эндпоинты (примеры)

- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — логин (возвращает JWT)
- `GET /api/user/me` — профиль (protected)
- `POST /api/items/buy` — купить предмет
- `GET /api/bosses` — список боссов и статусы
- `POST /api/clans` — создать братву
- `GET /api/clans/:id` — данные братвы

**Middleware:** проверка JWT, rate-limit для чувствительных эндпоинтов, валидация входа.

## 6. Socket.io — события и комнаты

**Комнаты (rooms):**

- `global` — общий чат
- `clan_<clanId>` — чат братвы
- `boss_<bossId>` — сессия боя с боссом

**Клиент → Сервер (пример):**

- `socket.emit('joinRoom', { room })`
- `socket.emit('chatMessage', { room, text })`
- `socket.emit('joinBoss', { bossId })`
- `socket.emit('dealDamage', { bossId, damage })`

**Сервер → Клиент (пример):**

- `io.to(room).emit('message', { ... })`
- `io.to('boss_<id>').emit('bossUpdate', { hp, log })`
- `io.to('boss_<id>').emit('bossDefeated', { rewards })`

Актуальная структура события `bossUpdate` (15.10.2025):

```
{
  bossId: ObjectId,
  currentHp: number,
  maxHp: number,
  damageDealt: number,         // = realDamage
  realDamage: number,          // точный нанесённый урон
  damage: number,              // базовый урон из клиента (10 или 20)
  weaponDamageBonus: number,   // бонус урона от экипированного оружия
  baseDamageWithWeapon: number, // damage + weaponDamageBonus
  dmgMult: number,             // множитель урона игрока
  dealtBy: { userId, nickname },
  crit: boolean,               // был ли крит
  critEffectiveMult: number,   // 1 или critDamageMultiplier
  participants: Array<{ userId, nickname, level, damageDealt, joinedAt }>
}
```

**Замечание по безопасности:** все изменения состояния (урон боссу, покупка) проверять на сервере и не доверять клиенту.

## 7. Модуль босс-боёв (кооператив)

### Компоненты модуля

- **BossManager (сервер)** — отвечает за spawn/sync боссов
- **BossSession** — объект, представляющий активную сессию боя: id, bossId, participants, hp, startTime
- **RewardDistributor** — по окончании боя распределяет награду согласно вкладу

### Поток данных (упрощённый)

1. Игрок подключается и `joinBoss(bossId)` → добавляется в комнату `boss_<bossId>`
2. Клиент отправляет `dealDamage` с базовым уроном (сейчас фиксированные варианты 10 или 20)
3. Сервер валидирует; пересчитывает реальный урон по характеристикам игрока
4. Сервер изменяет `currentHp` босса и эмитит `bossUpdate` всем участникам
5. Если `currentHp <= 0` → `bossDefeated` и запускается распределение наград

### Пример серверного обработчика (упрощённо)

```js
socket.on("dealDamage", async ({ bossId, damage }) => {
  const user = await User.findById(socket.userId);
  if (user.energy <= 0) return socket.emit("error", "no energy");

  // Серверная формула урона
  const realDamage = calculateDamage(user, damage);
  const boss = await Boss.findById(bossId);
  if (!boss || boss.state !== "active") return;

  boss.currentHp = Math.max(0, boss.currentHp - realDamage);
  await boss.save();

  io.to(`boss_${bossId}`).emit("bossUpdate", {
    currentHp: boss.currentHp,
    by: user._id,
    damage: realDamage,
  });

  if (boss.currentHp === 0) {
    boss.state = "dead";
    await boss.save();
    const rewards = await distributeRewards(bossId);
    io.to(`boss_${bossId}`).emit("bossDefeated", { rewards });
  }
});
```

### Обновления механики атак (15.10.2025)

- Удалён расход энергии при ударах по боссу (временное решение для балансировки и тестов).
- На клиенте (страница босса) вместо инпута добавлены две кнопки:
  - «Базовый удар (10)» → отправляет `dealDamage` с `damage = 10`;
  - «Сильный удар (20)» → отправляет `dealDamage` с `damage = 20`.
- Пересмотрена серверная формула урона:
  - УБРАН бонус за уровень;
  - Урон считается как: `realDamage = (baseDamage + weaponDamageBonus) × damageMultiplier × (isCrit ? critDamageMultiplier : 1)`;
  - Бонус от экипированного оружия добавляется к базовому урону;
  - Шанс крита: `critChance` (в процентах).
- Событие `bossUpdate` расширено полями: `realDamage`, `damage`, `weaponDamageBonus`, `baseDamageWithWeapon`, `dmgMult`, `crit`, `critEffectiveMult`, а также массивом `participants` с никнеймами/уровнями.
- Лог боя на клиенте показывает точный урон и разложение: `base`, `weapon bonus`, `dmgMult`, `critMult`.
- UI страницы босса отображает информацию об экипированном оружии и его влиянии на урон.
- Кнопки атаки показывают итоговый базовый урон с учетом бонуса от оружия.

### Характеристики игрока

Добавлены в модель пользователя и учитываются при расчёте урона:

- `damageMultiplier` (по умолчанию 1)
- `critDamageMultiplier` (по умолчанию 2)
- `critChance` (0..100, по умолчанию 0)

Скрипт для обновления статов пользователя:

```
node server/src/scripts/updateUserStats.js <nickname> [damageMultiplier] [critDamageMultiplier] [critChance]

// примеры
node server/src/scripts/updateUserStats.js fuway 100 2 80
node server/src/scripts/updateUserStats.js fuway 50 3 20
```

### Распределение наград

- Собери вклад каждого игрока (сколько дамага нанёс)
- Определи процент вклада
- Выдай награды (money, exp, предметы) пропорционально
- Зафиксируй в логе боя

## 8. Модуль братвы (кланов)

Функционал:

- создание/покидание братвы
- роли (лидер, офицер, рядовой)
- общий банк (общак)
- бонусы к урону/опыту при совместных боях
- чат братвы

**Эндпоинты:** `POST /api/clans`, `POST /api/clans/:id/join`, `POST /api/clans/:id/leave`, `POST /api/clans/:id/deposit`

## 9. Frontend (Vue) — структура и ключевые компоненты

**Худ (HUD):** верхняя панель с ником, энергией, деньгами, кнопкой "войти в бой".

**Основные вьюхи:**

- `LoginView` — регистрация/вход
- `ProfileView` — статы, инвентарь
- `CameraView` — основная локация и доступ к действиям
- `BossView` — текущий босс, список участников, шкала HP, кнопка "дать дёру"/"ударить"
- `ClanView` — управление братвой
- `ShopView` — покупка предметов

**Пример socket wrapper (client):**

```js
import { io } from "socket.io-client";
let socket;
export function connect(token) {
  socket = io(process.env.VUE_APP_WS_URL, { auth: { token } });
  return socket;
}
export function on(event, cb) {
  socket.on(event, cb);
}
export function emit(event, data) {
  socket.emit(event, data);
}
```

## 10. Игровая логика и механики (детальнее)

- **Энергия** — ресурс, тратится на удары по боссам и работу. Восстанавливается по таймеру (например +1 каждые 5 минут) или через предметы.
- **Работы** — активность для заработка денег/опыта. Асинхронные или с таймером (idle).
- **Оружие/экипировка** — дают множители к урону, бывают редкие предметы после убийства босса.
- **События** — ежедневный босс, рейды по расписанию, ивенты (например, обыск).
- **Античит и валидация** — все ключевые расчёты делаются на сервере.

## 11. MVP — список фич и спринты (4 недели)

**Неделя 1 — Базовая инфраструктура**

- Инициализация репозиториев (client/server)
- Setup: ESLint, Prettier, husky
- Регистрация/логин, JWT
- Модель User и базовый профиль

**Неделя 2 — UI/UX + чат**

- HUD, ProfileView, CameraView (mock)
- Реализация глобального чата (Socket.io)
- Энергия и простая работа (action with timer)

**Неделя 3 — Босс-механика**

- Модель Boss, BossManager
- Комнаты boss\_<id>, joinBoss, dealDamage
- Распределение наград и лог боя

**Неделя 4 — Братвы + Деплой**

- Создание братвы, чат братвы, общий банк
- Тестирование, багфиксы
- Деплой на Render / Vercel, подключение MongoDB Atlas

## 12. Тестирование и мониторинг

- Unit-tests: Jest (backend) и Vitest (frontend)
- Интеграционные тесты: supertest для API
- Нагрузка: локальный нагрузочный тест (k6)
- Логи: Winston (backend), Sentry (ошибки)
- Метрики: Prometheus / Grafana (опционально)

## 13. Деплой и инфраструктура

- CI: GitHub Actions — lint, tests, build
- Frontend: Vercel/Netlify
- Backend: Render/Railway (или Docker на VPS)
- БД: MongoDB Atlas (репликация + бэкапы)
- SSL: автоматический через провайдера хостинга

## 14. Кодстайл и соглашения

- JS: ES2022, async/await
- Линтер: ESLint + Prettier
- Коммиты: Conventional Commits (feat/fix/chore)
- API: возвращать стандартизированный JSON `{ ok: true, data, error: null }`
- Версионирование API: `/api/v1/...`

## 15. Дальше — возможные расширения

- Phaser / Pixi.js для богатой 2D-графики
- PWA / мобайл-адаптация
- Система достижений и лидербордов
- Экономика с NPC-торговлей и аукционом
- Интеграция с соцсетями/ботами (уведомления)

---

## Приложение: контрольный список для первого коммита

- [x] Инициализировать репозитории (client, server)
- [ ] Настроить ESLint + Prettier
- [ ] Создать Dockerfile (опционально)
- [x] Реализовать `POST /api/auth/register` и `POST /api/auth/login`
- [x] Реализовать socket auth middleware
- [x] Прототип главной страницы (HUD + чат)
- [x] Настроить MongoDB локально
- [x] Протестировать полный стек

## Статус проекта (обновлено 15.10.2025)

✅ **ЗАВЕРШЕНО:**

- Базовая структура проекта (client/server)
- Nuxt.js клиент с TailwindCSS
- Express.js сервер с Socket.io
- MongoDB модели (User, Boss, Clan, Message, Item, UserInventory, Work, UserWork)
- JWT аутентификация
- REST API (auth, user, boss, clan, item, work)
- Socket.io обработчики (чат, босс-бои)
- Базовые Vue компоненты (HUD, Login, Profile, Chat)
- MongoDB локальная настройка
- Полный стек протестирован и работает
- Настройка ESLint/Prettier для обоих проектов
- Создание тестовых боссов (3 босса разных уровней)
- Улучшение UI/UX с анимациями и градиентами
- Тестирование Socket.io чата
- Исправление API URLs в клиенте
- **Система предметов и магазин** (оружие, броня, расходники)
- **Система работы** (14 различных работ с прогрессом и наградами)

🚧 **В ПРОЦЕССЕ:**

- Добавление звуковых эффектов и музыки

📋 **СЛЕДУЮЩИЕ ШАГИ:**

- Оптимизация производительности
- Система инвентаря и экипировки
- Дополнительные игровые механики
- Система достижений

✅ **ДОПОЛНИТЕЛЬНО ЗАВЕРШЕНО:**

- Исправление ошибки покупки предметов в магазине
- Создание страницы магазина с фильтрами и красивым UI
- Реализация полной системы работы с:
  - 4 категориями работ (физический труд, умственный труд, опасные, незаконные)
  - Системой требований (уровень, энергия, уважение)
  - Кулдаунами от 5 минут до 8 часов
  - Штрафами при провале
  - Автоматическим повышением уровня
  - Отслеживанием прогресса в реальном времени
- **Улучшена система энергии:**
  - Увеличен лимит энергии с 100 до 1,000,000
  - Добавлено форматирование больших чисел
  - Реализовано реактивное обновление энергии после атаки
  - Добавлена кнопка "MAX" для быстрого выбора максимального урона
  - Автоматическая коррекция значения урона при превышении максимума
  - Улучшена формула расчета урона (базовый урон + 10% за уровень)
- **Исправлена система атаки боссов:**
  - Убрано ограничение максимального урона
  - Добавлено реактивное обновление HP босса
  - Исправлено отображение Invalid Date в списке участников
  - Улучшена синхронизация данных через Socket.io
- **Система инвентаря:**
  - Исправлено отображение инвентаря в профиле
  - Добавлена загрузка через API (GET /api/item/inventory/me)
  - Красивые иконки для типов предметов (⚔️ 🛡️ 💊)
  - Цветовая индикация редкости
  - Показывается статус экипировки
  - Счетчик использованных слотов
- **Навигация:**
  - Создан компонент PageNavigation с хлебными крошками
  - Быстрая навигация между разделами на всех страницах
  - Активная страница подсвечивается
  - Адаптивный дизайн для мобильных устройств
- **Авторизация через Cookies:**
  - Переход с localStorage на useCookie из Nuxt
  - Токен сохраняется на 30 дней
  - Автоматическая авторизация при перезагрузке страницы
  - Безопасные настройки cookie (sameSite, secure в production)
- **Влияние экипировки на урон:**
  - Экипированное оружие добавляет бонус к базовому урону
  - Формула: `realDamage = (baseDamage + weaponDamageBonus) × damageMultiplier × critMultiplier`
  - UI страницы босса показывает экипированное оружие и его бонус
  - Кнопки атаки отображают итоговый базовый урон с учетом экипировки
  - Лог боя детально показывает расчет урона с разбивкой по компонентам
  - Автоматическое обновление информации об экипировке при возврате на страницу

---
