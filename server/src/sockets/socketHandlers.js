import User from '../models/User.js';
import BossInstance from '../models/BossInstance.js';
import BossTemplate from '../models/BossTemplate.js';
import Message from '../models/Message.js';
import Clan from '../models/Clan.js';
import UserInventory from '../models/UserInventory.js';

// Функция для очистки истекших инстансов
const cleanupExpiredInstances = async () => {
  try {
    const expiredInstances = await BossInstance.find({
      isCompleted: false,
      expiresAt: { $lt: new Date() }
    });

    if (expiredInstances.length > 0) {
      console.log(`🧹 Найдено ${expiredInstances.length} истекших инстансов`);

      for (const instance of expiredInstances) {
        // Удаляем ссылку у владельца
        await User.findByIdAndUpdate(instance.ownerId, {
          $unset: { activeBossInstance: 1 }
        });

        // Удаляем инстанс
        await BossInstance.findByIdAndDelete(instance._id);
        console.log(`🗑️ Удален истекший инстанс ${instance._id}`);
      }
    }
  } catch (error) {
    console.error('❌ Ошибка очистки истекших инстансов:', error);
  }
};

// Распределение наград
const distributeRewards = async (instance, template, io) => {
  try {
    if (instance.rewardsDistributed) {
      return;
    }

    const totalDamage = instance.participants.reduce(
      (sum, p) => sum + p.damageDealt,
      0
    );

    const rewards = [];

    // Полные награды для каждого участника (без множителей)
    const moneyReward = template.rewards.money || 0;
    const expReward = template.rewards.exp || 0;

    for (const participant of instance.participants) {
      const user = await User.findById(participant.userId);
      if (!user) continue;

      // Начисляем полные награды всем участникам
      user.money += moneyReward;
      user.exp += expReward;

      // Проверяем повышение уровня
      const levelsGained = [];
      while (user.exp >= user.level * 1000) {
        const expToNextLevel = user.level * 1000;
        user.level += 1;
        user.exp -= expToNextLevel;
        levelsGained.push(user.level);
      }

      // Обновляем статистику босса у пользователя
      const bossStats = user.bossStats || new Map();
      const templateIdStr = template._id.toString();
      const currentStats = bossStats.get(templateIdStr) || {
        kills: 0,
        attempts: 0,
        bestTime: 0,
        lastKilledAt: null
      };

      currentStats.kills += 1;
      currentStats.lastKilledAt = new Date();

      // Обновляем лучшее время
      if (
        currentStats.bestTime === 0 ||
        instance.battleDuration < currentStats.bestTime
      ) {
        currentStats.bestTime = instance.battleDuration;
      }

      bossStats.set(templateIdStr, currentStats);
      user.bossStats = bossStats;

      await user.save();

      // Рассчитываем процент урона для статистики
      const damagePercentage =
        totalDamage > 0 ? (participant.damageDealt / totalDamage) * 100 : 0;

      rewards.push({
        userId: participant.userId,
        nickname: user.nickname,
        money: moneyReward,
        exp: expReward,
        levelsGained,
        damagePercentage: damagePercentage.toFixed(2)
      });

      // Отправляем награды пользователю
      io.to(`user_${participant.userId}`).emit('bossRewards', {
        money: moneyReward,
        exp: expReward,
        levelsGained,
        bossName: template.name
      });
    }

    // Отмечаем, что награды распределены
    instance.rewardsDistributed = true;
    await instance.save();

    return rewards;
  } catch (error) {
    console.error('❌ Ошибка распределения наград:', error);
    return [];
  }
};

// Обновление глобальной статистики шаблона
const updateTemplateStats = async (template, instance) => {
  try {
    const stats = template.stats || {
      totalKills: 0,
      totalAttempts: 0,
      averageKillTime: 0,
      fastestKillTime: 0,
      fastestKillBy: null
    };

    stats.totalKills += 1;

    // Обновляем среднее время
    if (stats.averageKillTime === 0) {
      stats.averageKillTime = instance.battleDuration;
    } else {
      stats.averageKillTime = Math.floor(
        (stats.averageKillTime * (stats.totalKills - 1) +
          instance.battleDuration) /
          stats.totalKills
      );
    }

    // Обновляем рекорд
    if (
      stats.fastestKillTime === 0 ||
      instance.battleDuration < stats.fastestKillTime
    ) {
      stats.fastestKillTime = instance.battleDuration;
      stats.fastestKillBy = instance.ownerId;
    }

    template.stats = stats;
    await template.save();
  } catch (error) {
    console.error('❌ Ошибка обновления статистики шаблона:', error);
  }
};

export const setupSocketHandlers = io => {
  // Middleware для отслеживания подключений
  io.use(async (socket, next) => {
    try {
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

    // Присоединение к личной комнате пользователя
    socket.join(`user_${socket.userId}`);

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

    // Присоединение к инстансу босса
    socket.on('joinBossInstance', async data => {
      try {
        const { instanceId } = data;

        const instance = await BossInstance.findById(instanceId)
          .populate('templateId')
          .populate('participants.userId', 'nickname level')
          .populate('ownerId', 'nickname level');

        if (!instance) {
          return socket.emit('error', { message: 'Инстанс не найден' });
        }

        // Проверяем, является ли пользователь участником или владельцем
        const isParticipant = instance.participants.some(
          p => p.userId._id.toString() === socket.userId.toString()
        );
        const isOwner =
          instance.ownerId._id.toString() === socket.userId.toString();

        if (!isParticipant && !isOwner) {
          return socket.emit('error', {
            message: 'Нет доступа к этому инстансу'
          });
        }

        // Присоединяемся к комнате инстанса
        const roomName = `boss_instance_${instanceId}`;
        socket.join(roomName);

        // Отправляем текущее состояние инстанса
        socket.emit('bossInstanceState', {
          instanceId: instance._id,
          templateId: instance.templateId._id,
          templateName: instance.templateId.name,
          currentHp: instance.currentHp,
          maxHp: instance.maxHp,
          expiresAt: instance.expiresAt,
          isCompleted: instance.isCompleted,
          ownerId: instance.ownerId._id,
          ownerNickname: instance.ownerId.nickname,
          isOwner: isOwner,
          participants: instance.participants.map(p => ({
            userId: p.userId._id,
            nickname: p.userId.nickname,
            level: p.userId.level,
            damageDealt: p.damageDealt,
            joinedAt: p.joinedAt
          }))
        });

        // Оповещаем всех в комнате о присоединении игрока (если не владелец)
        if (!isOwner && isParticipant) {
          io.to(roomName).emit('playerJoined', {
            instanceId: instance._id,
            player: {
              userId: socket.userId,
              nickname: socket.user.nickname,
              level: socket.user.level
            }
          });
        }

        console.log(
          `Пользователь ${socket.user?.nickname} присоединился к инстансу ${instanceId}`
        );
      } catch (error) {
        console.error('Ошибка присоединения к инстансу босса:', error);
        socket.emit('error', { message: 'Ошибка присоединения к инстансу' });
      }
    });

    // Нанесение урона боссу в инстансе
    socket.on('dealDamage', async data => {
      console.log('🔥 Получено событие dealDamage:', data);
      console.log('👤 Пользователь:', socket.user?.nickname, socket.userId);

      try {
        const { instanceId, damage } = data;

        if (!damage || damage <= 0) {
          console.log('❌ Неверный урон:', damage);
          return socket.emit('error', { message: 'Неверный урон' });
        }

        const user = await User.findById(socket.userId);
        if (!user) {
          console.log('❌ Пользователь не найден');
          return socket.emit('error', { message: 'Пользователь не найден' });
        }

        const instance =
          await BossInstance.findById(instanceId).populate('templateId');
        if (!instance) {
          console.log('❌ Инстанс не найден');
          return socket.emit('error', { message: 'Инстанс не найден' });
        }

        if (!instance.isAvailable()) {
          console.log('❌ Инстанс недоступен');
          return socket.emit('error', {
            message: 'Инстанс недоступен или истек'
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
        const damageDealt = instance.takeDamage(realDamage, socket.userId);
        if (damageDealt) {
          await instance.save();

          const roomName = `boss_instance_${instanceId}`;

          // Автоматически присоединяем пользователя к комнате босса, если он еще не в ней
          if (!socket.rooms.has(roomName)) {
            socket.join(roomName);
            console.log(
              `👥 Пользователь ${socket.user?.nickname} автоматически присоединен к комнате ${roomName}`
            );
          }

          // Заполняем участников ником и уровнем для отправки
          let participantsPayload = [];
          try {
            await instance.populate('participants.userId', 'nickname level');
            participantsPayload = (instance.participants || []).map(p => ({
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
            instanceId: instance._id,
            currentHp: instance.currentHp,
            maxHp: instance.maxHp,
            isCompleted: instance.isCompleted,
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

          io.to(roomName).emit('bossInstanceUpdate', updateData);

          // Если босс убит
          if (instance.currentHp === 0 && instance.isCompleted) {
            console.log('💀 Босс убит!');

            // Распределяем награды
            const rewards = await distributeRewards(
              instance,
              instance.templateId,
              io
            );

            // Обновляем глобальную статистику шаблона
            await updateTemplateStats(instance.templateId, instance);

            // Убираем активный инстанс у всех участников
            for (const participant of instance.participants) {
              await User.findByIdAndUpdate(participant.userId, {
                $unset: { activeBossInstance: 1 }
              });
            }

            io.to(roomName).emit('bossInstanceDefeated', {
              instanceId: instance._id,
              bossName: instance.templateId.name,
              dealtBy: {
                userId: socket.userId,
                nickname: socket.user.nickname
              },
              participants: participantsPayload,
              rewards,
              battleDuration: instance.battleDuration
            });

            // Создаем системное сообщение в глобальный чат
            try {
              const systemMessage = await Message.createSystemMessage(
                'global',
                null,
                `Босс ${instance.templateId.name} был побежден игроком ${socket.user.nickname}!`
              );

              io.to('global').emit('newMessage', {
                id: systemMessage._id,
                room: systemMessage.room,
                roomId: systemMessage.roomId,
                senderId: null,
                senderName: 'Система',
                text: systemMessage.text,
                createdAt: systemMessage.createdAt
              });
            } catch (e) {
              console.error('Ошибка создания системного сообщения:', e);
            }

            // Уведомляем всех в глобальном чате
            io.to('global').emit('bossDefeatedGlobal', {
              bossName: instance.templateId.name,
              dealtBy: socket.user.nickname
            });
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
            lastSeen: new Date()
          });
        }
      } catch (error) {
        console.error('Ошибка при отключении пользователя:', error);
      }
    });
  });

  // Запускаем периодическую очистку истекших инстансов (каждую минуту)
  setInterval(cleanupExpiredInstances, 60 * 1000);

  // Запускаем первую очистку сразу
  cleanupExpiredInstances();
};
