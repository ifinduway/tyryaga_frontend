import express from 'express';
import BossInstance from '../models/BossInstance.js';
import BossTemplate from '../models/BossTemplate.js';
import User from '../models/User.js';
import Friend from '../models/Friend.js';
import { authenticateToken } from '../middleware/auth.js';
import { getIO } from '../sockets/index.js';

const router = express.Router();

// Создание нового инстанса
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { templateId, isPrivate = false } = req.body;
    const userId = req.user._id;

    if (!templateId) {
      return res.status(400).json({
        ok: false,
        error: 'ID шаблона босса обязателен'
      });
    }

    // Проверяем, есть ли уже активный инстанс у игрока
    const existingInstance = await BossInstance.findOne({
      ownerId: userId,
      isCompleted: false,
      expiresAt: { $gt: new Date() }
    });

    if (existingInstance) {
      return res.status(400).json({
        ok: false,
        error: 'У вас уже есть активный инстанс босса',
        data: {
          instanceId: existingInstance._id
        }
      });
    }

    // Получаем шаблон босса
    const template = await BossTemplate.findById(templateId);
    if (!template || !template.isActive) {
      return res.status(404).json({
        ok: false,
        error: 'Шаблон босса не найден или неактивен'
      });
    }

    // Проверяем уровень игрока
    if (req.user.level < template.requiredLevel) {
      return res.status(403).json({
        ok: false,
        error: `Требуется уровень ${template.requiredLevel}`
      });
    }

    // Создаем инстанс
    const expiresAt = new Date(Date.now() + template.instanceDuration);
    const instance = new BossInstance({
      templateId: template._id,
      ownerId: userId,
      currentHp: template.maxHp,
      maxHp: template.maxHp,
      expiresAt,
      isPrivate: isPrivate,
      participants: [
        {
          userId,
          damageDealt: 0,
          joinedAt: new Date()
        }
      ]
    });

    await instance.save();

    // Обновляем пользователя
    await User.findByIdAndUpdate(userId, {
      activeBossInstance: instance._id
    });

    // Увеличиваем счетчик попыток в шаблоне
    await BossTemplate.findByIdAndUpdate(templateId, {
      $inc: { 'stats.totalAttempts': 1 }
    });

    // Увеличиваем счетчик попыток у пользователя
    const bossStats = req.user.bossStats || new Map();
    const currentStats = bossStats.get(templateId.toString()) || {
      kills: 0,
      attempts: 0,
      bestTime: 0,
      lastKilledAt: null
    };
    currentStats.attempts += 1;
    bossStats.set(templateId.toString(), currentStats);
    await User.findByIdAndUpdate(userId, { bossStats });

    // Заполняем данные о шаблоне
    await instance.populate(
      'templateId',
      'name level rewards instanceDuration'
    );

    res.status(201).json({
      ok: true,
      data: {
        instance: {
          id: instance._id,
          templateId: instance.templateId._id,
          templateName: instance.templateId.name,
          templateLevel: instance.templateId.level,
          rewards: instance.templateId.rewards,
          currentHp: instance.currentHp,
          maxHp: instance.maxHp,
          expiresAt: instance.expiresAt,
          createdAt: instance.createdAt,
          participants: instance.participants
        }
      }
    });
  } catch (error) {
    console.error('Ошибка создания инстанса:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка создания инстанса'
    });
  }
});

// Получение активного инстанса игрока (владелец или участник)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Ищем инстанс где пользователь владелец ИЛИ участник
    const instance = await BossInstance.findOne({
      $or: [{ ownerId: userId }, { 'participants.userId': userId }],
      isCompleted: false,
      expiresAt: { $gt: new Date() }
    })
      .populate('templateId', 'name level rewards instanceDuration')
      .populate('participants.userId', 'nickname level')
      .populate('ownerId', 'nickname level')
      .lean();

    if (!instance) {
      return res.json({
        ok: true,
        data: {
          instance: null
        }
      });
    }

    res.json({
      ok: true,
      data: {
        instance: {
          id: instance._id,
          templateId: instance.templateId._id,
          templateName: instance.templateId.name,
          templateLevel: instance.templateId.level,
          rewards: instance.templateId.rewards,
          currentHp: instance.currentHp,
          maxHp: instance.maxHp,
          expiresAt: instance.expiresAt,
          createdAt: instance.createdAt,
          isCompleted: instance.isCompleted,
          ownerId: instance.ownerId._id,
          ownerNickname: instance.ownerId.nickname,
          isOwner: instance.ownerId._id.toString() === userId.toString(),
          participants: instance.participants.map(p => ({
            userId: p.userId._id,
            nickname: p.userId.nickname,
            level: p.userId.level,
            damageDealt: p.damageDealt,
            joinedAt: p.joinedAt
          }))
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения активного инстанса:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения активного инстанса'
    });
  }
});

// Получение списка доступных инстансов для присоединения
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20 } = req.query;

    // Получаем список друзей
    const friends = await Friend.getFriends(userId);
    const friendIds = friends.map(f => f.userId.toString());

    // Находим публичные активные инстансы других игроков
    const publicInstances = await BossInstance.find({
      ownerId: { $ne: userId }, // Не наши инстансы
      'participants.userId': { $ne: userId }, // И мы еще не участвуем
      isPrivate: false, // Только публичные
      isCompleted: false,
      expiresAt: { $gt: new Date() }
    })
      .populate('templateId', 'name level')
      .populate('ownerId', 'nickname level')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Находим приватные инстансы друзей, где мы приглашены или где владелец - наш друг
    const friendsPrivateInstances = await BossInstance.find({
      $or: [
        // Приватные инстансы друзей
        {
          ownerId: { $in: friendIds, $ne: userId },
          isPrivate: true,
          isCompleted: false,
          expiresAt: { $gt: new Date() }
        },
        // Инстансы где мы приглашены
        {
          'invitedPlayers.userId': userId,
          isPrivate: true,
          isCompleted: false,
          expiresAt: { $gt: new Date() }
        }
      ],
      'participants.userId': { $ne: userId } // Мы еще не участвуем
    })
      .populate('templateId', 'name level')
      .populate('ownerId', 'nickname level')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    const mapInstance = instance => ({
      id: instance._id,
      templateName: instance.templateId.name,
      templateLevel: instance.templateId.level,
      ownerNickname: instance.ownerId.nickname,
      ownerLevel: instance.ownerId.level,
      currentHp: instance.currentHp,
      maxHp: instance.maxHp,
      participantCount: instance.participants.length,
      isPrivate: instance.isPrivate,
      expiresAt: instance.expiresAt,
      createdAt: instance.createdAt
    });

    res.json({
      ok: true,
      data: {
        publicInstances: publicInstances.map(mapInstance),
        friendsPrivateInstances: friendsPrivateInstances.map(mapInstance)
      }
    });
  } catch (error) {
    console.error('Ошибка получения доступных инстансов:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения доступных инстансов'
    });
  }
});

// Получение информации о конкретном инстансе
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const instance = await BossInstance.findById(id)
      .populate('templateId', 'name level rewards instanceDuration')
      .populate('participants.userId', 'nickname level')
      .lean();

    if (!instance) {
      return res.status(404).json({
        ok: false,
        error: 'Инстанс не найден'
      });
    }

    // Проверяем, является ли пользователь участником
    const isParticipant = instance.participants.some(
      p => p.userId._id.toString() === userId.toString()
    );

    if (!isParticipant && instance.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        ok: false,
        error: 'Нет доступа к этому инстансу'
      });
    }

    res.json({
      ok: true,
      data: {
        instance: {
          id: instance._id,
          templateId: instance.templateId._id,
          templateName: instance.templateId.name,
          templateLevel: instance.templateId.level,
          rewards: instance.templateId.rewards,
          currentHp: instance.currentHp,
          maxHp: instance.maxHp,
          expiresAt: instance.expiresAt,
          createdAt: instance.createdAt,
          isCompleted: instance.isCompleted,
          completedAt: instance.completedAt,
          battleDuration: instance.battleDuration,
          ownerId: instance.ownerId,
          participants: instance.participants.map(p => ({
            userId: p.userId._id,
            nickname: p.userId.nickname,
            level: p.userId.level,
            damageDealt: p.damageDealt,
            joinedAt: p.joinedAt
          }))
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения информации об инстансе:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения информации об инстансе'
    });
  }
});

// Присоединение к инстансу (для групповой игры)
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const instance = await BossInstance.findById(id)
      .populate('templateId', 'name level rewards')
      .populate('ownerId', 'nickname level');

    if (!instance) {
      return res.status(404).json({
        ok: false,
        error: 'Инстанс не найден'
      });
    }

    if (!instance.isAvailable()) {
      return res.status(400).json({
        ok: false,
        error: 'Инстанс недоступен или уже завершен'
      });
    }

    // Проверяем, не является ли пользователь владельцем
    if (instance.ownerId._id.toString() === userId.toString()) {
      return res.status(400).json({
        ok: false,
        error: 'Это ваш собственный инстанс'
      });
    }

    // Проверяем, нет ли у игрока активного инстанса где он владелец
    const userActiveInstance = await BossInstance.findOne({
      ownerId: userId,
      isCompleted: false,
      expiresAt: { $gt: new Date() }
    });

    if (userActiveInstance) {
      return res.status(400).json({
        ok: false,
        error:
          'У вас уже есть активный инстанс. Завершите его или дождитесь истечения времени.'
      });
    }

    // Добавляем участника
    const added = instance.addParticipant(userId);
    if (!added) {
      return res.status(400).json({
        ok: false,
        error: 'Вы уже участвуете в этом инстансе'
      });
    }

    await instance.save();

    // Обновляем активный инстанс у пользователя (теперь он участник, не владелец)
    await User.findByIdAndUpdate(userId, {
      activeBossInstance: instance._id
    });

    res.json({
      ok: true,
      data: {
        message: 'Вы присоединились к бою',
        instance: {
          id: instance._id,
          templateName: instance.templateId.name,
          templateLevel: instance.templateId.level,
          ownerName: instance.ownerId.nickname,
          currentHp: instance.currentHp,
          maxHp: instance.maxHp,
          expiresAt: instance.expiresAt
        }
      }
    });
  } catch (error) {
    console.error('Ошибка присоединения к инстансу:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка присоединения к инстансу'
    });
  }
});

// Удаление/завершение инстанса (только владелец)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const instance = await BossInstance.findById(id);
    if (!instance) {
      return res.status(404).json({
        ok: false,
        error: 'Инстанс не найден'
      });
    }

    // Проверяем, является ли пользователь владельцем
    if (instance.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        ok: false,
        error: 'Только владелец может удалить инстанс'
      });
    }

    // Удаляем инстанс
    await BossInstance.findByIdAndDelete(id);

    // Обновляем пользователя
    await User.findByIdAndUpdate(userId, {
      $unset: { activeBossInstance: 1 }
    });

    res.json({
      ok: true,
      data: {
        message: 'Инстанс удален'
      }
    });
  } catch (error) {
    console.error('Ошибка удаления инстанса:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка удаления инстанса'
    });
  }
});

// Пригласить друга в приватный бой
router.post('/:id/invite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { friendId } = req.body;
    const userId = req.user._id;

    if (!friendId) {
      return res.status(400).json({
        ok: false,
        error: 'ID друга обязателен'
      });
    }

    // Получаем инстанс
    const instance = await BossInstance.findById(id)
      .populate('templateId', 'name level')
      .populate('ownerId', 'nickname level');

    if (!instance) {
      return res.status(404).json({
        ok: false,
        error: 'Инстанс не найден'
      });
    }

    // Проверяем, что пользователь владелец инстанса
    if (instance.ownerId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        ok: false,
        error: 'Только владелец может приглашать игроков'
      });
    }

    // Проверяем, что инстанс приватный
    if (!instance.isPrivate) {
      return res.status(400).json({
        ok: false,
        error: 'Этот инстанс публичный, приглашения не требуются'
      });
    }

    // Проверяем, что инстанс доступен
    if (!instance.isAvailable()) {
      return res.status(400).json({
        ok: false,
        error: 'Инстанс недоступен или завершен'
      });
    }

    // Проверяем, что пользователи друзья
    const areFriends = await Friend.areFriends(userId, friendId);
    if (!areFriends) {
      return res.status(403).json({
        ok: false,
        error: 'Можно приглашать только друзей'
      });
    }

    // Проверяем, что друг еще не участвует
    const alreadyParticipant = instance.participants.some(
      p => p.userId.toString() === friendId.toString()
    );
    if (alreadyParticipant) {
      return res.status(400).json({
        ok: false,
        error: 'Этот игрок уже участвует в бою'
      });
    }

    // Приглашаем друга
    const invited = instance.invitePlayer(friendId);
    if (!invited) {
      return res.status(400).json({
        ok: false,
        error: 'Этот игрок уже приглашен'
      });
    }

    await instance.save();

    // Получаем данные о друге
    const friend = await User.findById(friendId, 'nickname level');

    // Отправляем уведомление через Socket.io
    const io = getIO();
    if (io) {
      io.to(`user_${friendId}`).emit('bossInvitationReceived', {
        invitationId: instance._id,
        from: {
          userId: instance.ownerId._id,
          nickname: instance.ownerId.nickname
        },
        instance: {
          id: instance._id,
          bossName: instance.templateId.name,
          bossLevel: instance.templateId.level,
          currentHp: instance.currentHp,
          maxHp: instance.maxHp,
          expiresAt: instance.expiresAt
        }
      });
    }

    res.json({
      ok: true,
      data: {
        message: 'Игрок приглашен',
        invitation: {
          instanceId: instance._id,
          friend: {
            userId: friend._id,
            nickname: friend.nickname,
            level: friend.level
          },
          bossName: instance.templateId.name,
          bossLevel: instance.templateId.level
        }
      }
    });
  } catch (error) {
    console.error('Ошибка приглашения друга:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка приглашения друга'
    });
  }
});

export default router;
