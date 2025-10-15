import User from '../models/User.js';
import Boss from '../models/Boss.js';
import Message from '../models/Message.js';
import Clan from '../models/Clan.js';
import UserInventory from '../models/UserInventory.js';

// Функция инициализации боссов при запуске сервера
const initializeBosses = async () => {
  try {
    console.log('🔄 Инициализация боссов...');
    const deadBosses = await Boss.find({ state: 'dead' });

    if (deadBosses.length > 0) {
      console.log(
        `💀 Найдено ${deadBosses.length} мертвых боссов, возрождаем...`
      );

      for (const boss of deadBosses) {
        await Boss.findByIdAndUpdate(boss._id, {
          state: 'available',
          currentHp: boss.maxHp,
          participants: [],
          defeatedAt: null
        });
        console.log(`✅ Босс ${boss.name} возрожден!`);
      }
    } else {
      console.log('✅ Все боссы живы');
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации боссов:', error);
  }
};

export const setupSocketHandlers = io => {
  // Middleware для отслеживания подключений
  io.use(async (socket, next) => {
    try {
      // Обновляем статус пользователя как онлайн
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          online: true,
          lastSeen: new Date()
        });
      }
      next();
    } catch (error) {
      console.error('Socket middleware error:', error);
      next(error);
    }
  });

  // Обработка подключения
  io.on('connection', async socket => {
    console.log(
      `Пользователь ${socket.user?.nickname} подключился (${socket.id})`
    );

    // Присоединение к глобальному чату
    socket.join('global');

    // Отправляем последние сообщения глобального чата
    try {
      const messages = await Message.getRoomMessages('global', null, 20);
      socket.emit('chatHistory', {
        room: 'global',
        messages: messages.reverse()
      });
    } catch (error) {
      console.error('Ошибка загрузки истории чата:', error);
    }

    // Обработка сообщений чата
    socket.on('chatMessage', async data => {
      try {
        const { room, roomId, text } = data;

        if (!text || text.trim().length === 0) {
          return socket.emit('error', {
            message: 'Сообщение не может быть пустым'
          });
        }

        if (text.length > 500) {
          return socket.emit('error', { message: 'Сообщение слишком длинное' });
        }

        // Создаем сообщение
        const message = new Message({
          room,
          roomId,
          senderId: socket.userId,
          text: text.trim()
        });

        await message.save();

        // Заполняем данные отправителя
        await message.populate('senderId', 'nickname');

        // Отправляем сообщение всем в комнате
        const fullRoomName = roomId ? `${room}_${roomId}` : room;
        io.to(fullRoomName).emit('newMessage', {
          id: message._id,
          room: message.room,
          roomId: message.roomId,
          senderId: message.senderId._id,
          senderName: message.senderId.nickname,
          text: message.text,
          createdAt: message.createdAt
        });
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        socket.emit('error', { message: 'Ошибка отправки сообщения' });
      }
    });

    // Присоединение к комнате
    socket.on('joinRoom', async data => {
      try {
        const { room, roomId } = data;
        const fullRoomName = roomId ? `${room}_${roomId}` : room;

        // Проверяем права доступа к комнате
        if (room === 'clan') {
          const user = await User.findById(socket.userId);
          if (!user.clanId || user.clanId.toString() !== roomId) {
            return socket.emit('error', {
              message: 'Нет доступа к чату клана'
            });
          }
        }

        socket.join(fullRoomName);

        // Отправляем историю сообщений
        const messages = await Message.getRoomMessages(room, roomId, 20);
        socket.emit('chatHistory', {
          room,
          roomId,
          messages: messages.reverse()
        });

        console.log(
          `Пользователь ${socket.user?.nickname} присоединился к комнате ${fullRoomName}`
        );
      } catch (error) {
        console.error('Ошибка присоединения к комнате:', error);
        socket.emit('error', { message: 'Ошибка присоединения к комнате' });
      }
    });

    // Покидание комнаты
    socket.on('leaveRoom', data => {
      const { room, roomId } = data;
      const fullRoomName = roomId ? `${room}_${roomId}` : room;
      socket.leave(fullRoomName);
      console.log(
        `Пользователь ${socket.user?.nickname} покинул комнату ${fullRoomName}`
      );
    });

    // Нанесение урона боссу
    socket.on('dealDamage', async data => {
      console.log('🔥 Получено событие dealDamage:', data);
      console.log('👤 Пользователь:', socket.user?.nickname, socket.userId);

      try {
        const { bossId, damage } = data;

        if (!damage || damage <= 0) {
          console.log('❌ Неверный урон:', damage);
          return socket.emit('error', { message: 'Неверный урон' });
        }

        const user = await User.findById(socket.userId);
        if (!user) {
          console.log('❌ Пользователь не найден');
          return socket.emit('error', { message: 'Пользователь не найден' });
        }

        // Проверяем, не атакует ли пользователь уже другого босса
        if (user.currentBossId && user.currentBossId.toString() !== bossId) {
          console.log(
            '❌ Пользователь уже атакует другого босса:',
            user.currentBossId
          );
          return socket.emit('error', {
            message: 'Вы уже атакуете другого босса'
          });
        }

        const boss = await Boss.findById(bossId);
        if (!boss || !boss.isAvailable()) {
          console.log('❌ Босс недоступен');
          return socket.emit('error', { message: 'Босс недоступен' });
        }

        // Устанавливаем текущего босса для пользователя
        if (!user.currentBossId) {
          await User.findByIdAndUpdate(socket.userId, {
            currentBossId: bossId
          });
        }

        // Получаем экипированное оружие и броню
        const inventory = await UserInventory.findOne({
          userId: socket.userId
        }).populate('items.itemId');

        let weaponDamageBonus = 0;
        let critChanceBonus = 0;
        let critDamageMultiplier = user.critDamageMultiplier || 2;

        if (inventory) {
          const equippedWeapon = inventory.items.find(
            item => item.equipped && item.slot === 'weapon' && item.itemId
          );
          const equippedItems = inventory.items.filter(
            item =>
              item.equipped &&
              item.itemId &&
              ['helmet', 'boots', 'body', 'gloves', 'ring'].includes(item.slot)
          );

          // Обрабатываем оружие
          if (equippedWeapon && equippedWeapon.itemId) {
            weaponDamageBonus = equippedWeapon.itemId.stats?.damage || 0;

            // Проверяем эффекты оружия
            if (equippedWeapon.itemId.effects) {
              for (const effect of equippedWeapon.itemId.effects) {
                if (effect.type === 'damage_boost' && effect.duration === 0) {
                  weaponDamageBonus = Math.max(weaponDamageBonus, effect.value);
                }
              }
            }
          }

          // Обрабатываем экипированные предметы
          for (const item of equippedItems) {
            if (item.itemId.stats?.damage) {
              weaponDamageBonus += item.itemId.stats.damage;
            }

            if (item.itemId.effects) {
              for (const effect of item.itemId.effects) {
                if (effect.type === 'luck_boost' && effect.duration === 0) {
                  critChanceBonus += effect.value;
                } else if (
                  effect.type === 'damage_boost' &&
                  effect.duration === 0
                ) {
                  critDamageMultiplier = Math.max(
                    critDamageMultiplier,
                    effect.value
                  );
                }
              }
            }
          }
        }

        // Рассчитываем реальный урон
        const baseDamageWithWeapon = damage + weaponDamageBonus;
        const dmgMult = Math.max(0.1, user.damageMultiplier || 1);
        const critMult = Math.max(1, critDamageMultiplier);
        const critChance = Math.min(
          100,
          Math.max(0, (user.critChance || 0) + critChanceBonus)
        );

        const isCrit = Math.random() * 100 < critChance;
        const realDamage = Math.floor(
          baseDamageWithWeapon * dmgMult * (isCrit ? critMult : 1)
        );

        // Наносим урон боссу
        const damageDealt = boss.takeDamage(realDamage, socket.userId);
        if (damageDealt) {
          await boss.save();

          const roomName = `boss_${bossId}`;

          // Автоматически присоединяем пользователя к комнате босса
          socket.join(roomName);

          // Заполняем участников ником и уровнем для отправки
          let participantsPayload = [];
          try {
            await boss.populate('participants.userId', 'nickname level');
            participantsPayload = (boss.participants || []).map(p => ({
              userId:
                p.userId?._id?.toString?.() ||
                p.userId?.toString?.() ||
                p.userId,
              nickname: p.userId?.nickname || 'Игрок',
              level: p.userId?.level || 1,
              damageDealt: p.damageDealt || 0,
              joinedAt: p.joinedAt || null
            }));
          } catch (e) {
            console.error('Ошибка populate участников при обновлении:', e);
          }

          const updateData = {
            bossId: boss._id,
            currentHp: boss.currentHp,
            maxHp: boss.maxHp,
            state: boss.state,
            damageDealt: realDamage,
            realDamage: realDamage,
            damage: damage,
            weaponDamageBonus: weaponDamageBonus,
            baseDamageWithWeapon: baseDamageWithWeapon,
            dmgMult: dmgMult,
            critChance: critChance,
            critChanceBonus: critChanceBonus,
            critDamageMultiplier: critDamageMultiplier,
            dealtBy: {
              userId: socket.userId,
              nickname: socket.user.nickname
            },
            crit: isCrit,
            critEffectiveMult: isCrit ? critMult : 1,
            participants: participantsPayload
          };

          io.to(roomName).emit('bossUpdate', updateData);

          // Если босс убит
          if (boss.currentHp === 0) {
            console.log('💀 Босс убит!');

            // Устанавливаем состояние "мертв"
            boss.state = 'dead';
            await boss.save();

            // Обновляем статистику убийств для пользователя
            await User.findByIdAndUpdate(socket.userId, {
              $inc: { [`bossKills.${boss._id}`]: 1 },
              $unset: { currentBossId: 1 } // Снимаем текущего босса
            });

            io.to(roomName).emit('bossDefeated', {
              bossId: boss._id,
              bossName: boss.name,
              dealtBy: {
                userId: socket.userId,
                nickname: socket.user.nickname
              },
              participants: participantsPayload
            });

            // Создаем системное сообщение
            await Message.createSystemMessage(
              'global',
              null,
              `Босс ${boss.name} был побежден игроком ${socket.user.nickname}!`
            );

            // Уведомляем всех в глобальном чате
            io.to('global').emit('bossDefeatedGlobal', {
              bossName: boss.name,
              dealtBy: socket.user.nickname
            });

            // Сразу возрождаем босса
            await Boss.findByIdAndUpdate(boss._id, {
              currentHp: boss.maxHp,
              participants: [],
              defeatedAt: null,
              state: 'available'
            });
            console.log(`🔄 Босс ${boss.name} возрожден! HP: ${boss.maxHp}`);

            // Отправляем обновление о возрожденном боссе
            const respawnUpdate = {
              bossId: boss._id,
              currentHp: boss.maxHp,
              maxHp: boss.maxHp,
              participants: [],
              state: 'available'
            };
            console.log(
              '📡 Отправляем обновление о возрождении:',
              respawnUpdate
            );
            io.to(roomName).emit('bossUpdate', respawnUpdate);
          }
        }
      } catch (error) {
        console.error('❌ Ошибка нанесения урона:', error);
        socket.emit('error', { message: 'Ошибка нанесения урона' });
      }
    });

    // Обработка отключения
    socket.on('disconnect', async () => {
      try {
        console.log(
          `Пользователь ${socket.user?.nickname} отключился (${socket.id})`
        );

        // Обновляем статус пользователя как оффлайн
        if (socket.userId) {
          await User.findByIdAndUpdate(socket.userId, {
            online: false,
            lastSeen: new Date(),
            $unset: { currentBossId: 1 } // Снимаем текущего босса при отключении
          });
        }
      } catch (error) {
        console.error('Ошибка при отключении пользователя:', error);
      }
    });
  });

  // Функция распределения наград
  const distributeRewards = async boss => {
    try {
      const totalDamage = boss.participants.reduce(
        (sum, p) => sum + p.damageDealt,
        0
      );
      const rewards = [];

      for (const participant of boss.participants) {
        const damagePercentage = participant.damageDealt / totalDamage;
        const userRewards = boss.calculateRewards(participant.userId);

        if (userRewards) {
          const user = await User.findById(participant.userId);
          if (user) {
            user.money += userRewards.money;
            user.exp += userRewards.exp;

            // Проверяем повышение уровня (может быть несколько уровней сразу)
            while (user.exp >= user.level * 1000) {
              const expToNextLevel = user.level * 1000;
              user.level += 1;
              user.exp -= expToNextLevel;
            }

            await user.save();

            rewards.push({
              userId: participant.userId,
              nickname: user.nickname,
              money: userRewards.money,
              exp: userRewards.exp,
              items: userRewards.items,
              damagePercentage: (damagePercentage * 100).toFixed(2)
            });
          }
        }
      }

      return rewards;
    } catch (error) {
      console.error('Ошибка распределения наград:', error);
      return [];
    }
  };

  // Инициализируем боссов при запуске сервера
  initializeBosses();
};
