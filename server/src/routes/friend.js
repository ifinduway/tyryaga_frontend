import express from 'express';
import Friend from '../models/Friend.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { getIO } from '../sockets/index.js';

const router = express.Router();

// Отправить запрос в друзья
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { targetNickname } = req.body;
    const userId = req.user._id;

    // Находим целевого пользователя
    const targetUser = await User.findOne({ nickname: targetNickname });
    if (!targetUser) {
      return res.status(404).json({
        ok: false,
        error: 'Пользователь не найден'
      });
    }

    // Проверяем, что пользователь не отправляет запрос самому себе
    if (targetUser._id.toString() === userId.toString()) {
      return res.status(400).json({
        ok: false,
        error: 'Нельзя добавить самого себя в друзья'
      });
    }

    // Проверяем, нет ли уже запроса или дружбы
    const existingFriendship = await Friend.findOne({
      $or: [
        { userId: userId, friendId: targetUser._id },
        { userId: targetUser._id, friendId: userId }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({
          ok: false,
          error: 'Вы уже друзья'
        });
      } else if (existingFriendship.status === 'pending') {
        return res.status(400).json({
          ok: false,
          error: 'Запрос уже отправлен'
        });
      }
    }

    // Создаем запрос в друзья
    const friendship = await Friend.create({
      userId: userId,
      friendId: targetUser._id,
      status: 'pending'
    });

    // Получаем полные данные для ответа
    const populatedFriendship = await Friend.findById(friendship._id)
      .populate('userId', 'nickname level')
      .populate('friendId', 'nickname level');

    // Отправляем уведомление через Socket.io
    const io = getIO();
    if (io) {
      io.to(`user_${targetUser._id}`).emit('friendRequestReceived', {
        requestId: populatedFriendship._id,
        from: {
          userId: populatedFriendship.userId._id,
          nickname: populatedFriendship.userId.nickname,
          level: populatedFriendship.userId.level
        }
      });
    }

    res.json({
      ok: true,
      data: {
        friendship: {
          id: populatedFriendship._id,
          from: {
            userId: populatedFriendship.userId._id,
            nickname: populatedFriendship.userId.nickname,
            level: populatedFriendship.userId.level
          },
          to: {
            userId: populatedFriendship.friendId._id,
            nickname: populatedFriendship.friendId.nickname,
            level: populatedFriendship.friendId.level
          },
          status: populatedFriendship.status,
          createdAt: populatedFriendship.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Ошибка отправки запроса в друзья:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка отправки запроса в друзья'
    });
  }
});

// Получить список друзей и запросов
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    let query = {
      $or: [{ userId: userId }, { friendId: userId }]
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const friendships = await Friend.find(query)
      .populate('userId', 'nickname level')
      .populate('friendId', 'nickname level')
      .sort({ createdAt: -1 });

    // Разделяем на категории
    const friends = [];
    const incomingRequests = [];
    const outgoingRequests = [];

    friendships.forEach(f => {
      const isInitiator = f.userId._id.toString() === userId.toString();
      const friend = isInitiator ? f.friendId : f.userId;

      const friendData = {
        friendshipId: f._id,
        userId: friend._id,
        nickname: friend.nickname,
        level: friend.level,
        status: f.status,
        createdAt: f.createdAt,
        acceptedAt: f.acceptedAt
      };

      if (f.status === 'accepted') {
        friends.push(friendData);
      } else if (f.status === 'pending') {
        if (isInitiator) {
          outgoingRequests.push(friendData);
        } else {
          incomingRequests.push(friendData);
        }
      }
    });

    res.json({
      ok: true,
      data: {
        friends,
        incomingRequests,
        outgoingRequests
      }
    });
  } catch (error) {
    console.error('Ошибка получения списка друзей:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения списка друзей'
    });
  }
});

// Принять запрос в друзья
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const friendship = await Friend.findById(id);
    if (!friendship) {
      return res.status(404).json({
        ok: false,
        error: 'Запрос не найден'
      });
    }

    // Проверяем, что запрос был отправлен текущему пользователю
    if (friendship.friendId.toString() !== userId.toString()) {
      return res.status(403).json({
        ok: false,
        error: 'Нет доступа к этому запросу'
      });
    }

    // Проверяем статус
    if (friendship.status !== 'pending') {
      return res.status(400).json({
        ok: false,
        error: 'Запрос уже обработан'
      });
    }

    // Принимаем запрос
    friendship.status = 'accepted';
    friendship.acceptedAt = new Date();
    await friendship.save();

    const populatedFriendship = await Friend.findById(friendship._id)
      .populate('userId', 'nickname level')
      .populate('friendId', 'nickname level');

    // Отправляем уведомление инициатору запроса
    const io = getIO();
    if (io) {
      io.to(`user_${populatedFriendship.userId._id}`).emit(
        'friendRequestAccepted',
        {
          friend: {
            userId: populatedFriendship.friendId._id,
            nickname: populatedFriendship.friendId.nickname,
            level: populatedFriendship.friendId.level
          }
        }
      );
    }

    res.json({
      ok: true,
      data: {
        friendship: {
          id: populatedFriendship._id,
          friend: {
            userId: populatedFriendship.userId._id,
            nickname: populatedFriendship.userId.nickname,
            level: populatedFriendship.userId.level
          },
          acceptedAt: populatedFriendship.acceptedAt
        }
      }
    });
  } catch (error) {
    console.error('Ошибка принятия запроса в друзья:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка принятия запроса в друзья'
    });
  }
});

// Отклонить запрос в друзья
router.post('/:id/decline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const friendship = await Friend.findById(id);
    if (!friendship) {
      return res.status(404).json({
        ok: false,
        error: 'Запрос не найден'
      });
    }

    // Проверяем, что запрос был отправлен текущему пользователю
    if (friendship.friendId.toString() !== userId.toString()) {
      return res.status(403).json({
        ok: false,
        error: 'Нет доступа к этому запросу'
      });
    }

    // Удаляем запрос
    await Friend.findByIdAndDelete(id);

    res.json({
      ok: true,
      data: {
        message: 'Запрос отклонен'
      }
    });
  } catch (error) {
    console.error('Ошибка отклонения запроса в друзья:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка отклонения запроса в друзья'
    });
  }
});

// Удалить из друзей
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const friendship = await Friend.findById(id);
    if (!friendship) {
      return res.status(404).json({
        ok: false,
        error: 'Дружба не найдена'
      });
    }

    // Проверяем, что пользователь участвует в этой дружбе
    const isParticipant =
      friendship.userId.toString() === userId.toString() ||
      friendship.friendId.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        ok: false,
        error: 'Нет доступа к этой дружбе'
      });
    }

    await Friend.findByIdAndDelete(id);

    res.json({
      ok: true,
      data: {
        message: 'Друг удален'
      }
    });
  } catch (error) {
    console.error('Ошибка удаления друга:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка удаления друга'
    });
  }
});

export default router;
