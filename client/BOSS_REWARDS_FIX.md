# Исправление обновления статистики после убийства босса

## Проблема

После убийства босса статистика пользователя (деньги, уровень, опыт) не обновлялась на клиенте в реальном времени. Требовалась перезагрузка страницы для отображения актуальных данных.

## Причина

При получении наград через Socket.io события `bossRewards` и `bossInstanceDefeated`, данные обновлялись на сервере, но клиентский `authStore` не знал об этих изменениях.

## Решение

### 1. Добавлен метод `updateUserStats` в `authStore`

**Файл:** `client/stores/auth.js`

```javascript
// Обновление статистики пользователя (деньги, уровень, опыт)
const updateUserStats = stats => {
  if (user.value) {
    console.log('🔄 Обновление статистики пользователя:', {
      old: {
        money: user.value.money,
        exp: user.value.exp,
        level: user.value.level
      },
      new: stats
    });
    user.value = {
      ...user.value,
      ...stats
    };
    console.log('✅ Статистика обновлена:', {
      money: user.value.money,
      exp: user.value.exp,
      level: user.value.level
    });
  }
};
```

### 2. Обновление store при получении наград

**Файл:** `client/pages/bosses/[id].vue`

#### В обработчике `bossRewards`:

```javascript
socket.on('bossRewards', data => {
  console.log('🎁 Получены награды:', data);

  // ... логирование в battleLog

  // Обновляем статистику пользователя в store
  if (authStore.user) {
    const newMoney = (authStore.user.money || 0) + data.money;
    const newExp = (authStore.user.exp || 0) + data.exp;
    let newLevel = authStore.user.level || 1;

    // Обрабатываем повышение уровня
    if (data.levelsGained && data.levelsGained.length > 0) {
      newLevel = data.levelsGained[data.levelsGained.length - 1];
    }

    authStore.updateUserStats({
      money: newMoney,
      exp: newExp,
      level: newLevel
    });
  }
});
```

#### В обработчике `bossInstanceDefeated`:

```javascript
socket.on('bossInstanceDefeated', data => {
  // ... обработка события

  if (data.rewards && data.rewards.length > 0) {
    const userReward = data.rewards.find(
      r => r.userId === (user.value?._id || user.value?.id)
    );

    if (userReward) {
      // ... логирование

      // Обновляем статистику
      if (authStore.user) {
        const newMoney = (authStore.user.money || 0) + userReward.money;
        const newExp = (authStore.user.exp || 0) + userReward.exp;
        let newLevel = authStore.user.level || 1;

        if (userReward.levelsGained?.length > 0) {
          newLevel =
            userReward.levelsGained[userReward.levelsGained.length - 1];
        }

        authStore.updateUserStats({
          money: newMoney,
          exp: newExp,
          level: newLevel
        });
      }
    }
  }
});
```

### 3. Улучшена реактивность в `authStore`

Заменили `readonly(user)` на `computed(() => user.value)` для гарантированной реактивности:

```javascript
return {
  user: computed(() => user.value),
  // ... остальные методы
  updateUserStats
};
```

## Как это работает

1. **Сервер начисляет награды** через Socket.io событие `bossRewards`
2. **Клиент получает событие** с информацией о наградах
3. **Вызывается `updateUserStats`** для обновления локального состояния
4. **Компонент `GameHUD` автоматически обновляется** благодаря реактивности Vue:
   ```javascript
   // GameHUD.vue
   const user = computed(() => authStore.user);
   ```
5. **Пользователь видит актуальную статистику** без перезагрузки страницы

## Преимущества решения

✅ **Реал-тайм обновления** - статистика обновляется мгновенно
✅ **Логирование** - легко отследить изменения через консоль
✅ **Централизованное управление** - все обновления через один метод
✅ **Реактивность Vue** - автоматическое обновление UI
✅ **Обработка level-up** - корректное отображение новых уровней

## Отладка

Для отладки открыть консоль браузера и смотреть логи:

- 🔄 **Обновление статистики пользователя** - перед обновлением
- ✅ **Статистика обновлена** - после обновления
- 🎁 **Получены награды** - при получении события

## Тестирование

1. Создать/присоединиться к инстансу босса
2. Убить босса
3. ✅ Статистика (💰 деньги, уровень) обновляется мгновенно в GameHUD
4. ✅ Уведомление о level-up появляется в логе боя
5. ✅ Не требуется перезагрузка страницы

## Связанные файлы

- `client/stores/auth.js` - добавлен метод `updateUserStats`
- `client/pages/bosses/[id].vue` - обработка Socket.io событий
- `client/components/organisms/GameHUD.vue` - отображение статистики
- `server/src/sockets/socketHandlers.js` - отправка событий с сервера

## Дата исправления

15 октября 2024
