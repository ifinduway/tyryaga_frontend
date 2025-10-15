import express from 'express';
import Work from '../models/Work.js';
import UserWork from '../models/UserWork.js';
import User from '../models/User.js';

const router = express.Router();

// Получение списка доступных работ
router.get('/', async (req, res) => {
  try {
    const { level, category, energy } = req.query;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, error: 'Пользователь не найден' });
    }

    const filter = {};

    // Фильтр по уровню
    if (level) {
      filter.level = { $lte: parseInt(level) };
    } else {
      filter.level = { $lte: user.level };
    }

    // Фильтр по категории
    if (category) {
      filter.category = category;
    }

    // Фильтр по энергии
    if (energy) {
      filter.energyCost = { $lte: parseInt(energy) };
    } else {
      filter.energyCost = { $lte: user.energy };
    }

    // Фильтр по уважению
    filter['requirements.respect'] = { $lte: user.respect };

    const works = await Work.find(filter).sort({ level: 1, moneyReward: 1 });

    // Проверяем, какие работы сейчас выполняются пользователем
    const activeWorks = await UserWork.find({
      userId,
      status: 'working'
    }).populate('workId');

    const worksWithStatus = works.map(work => {
      const activeWork = activeWorks.find(
        aw => aw.workId._id.toString() === work._id.toString()
      );
      return {
        ...work.toObject(),
        isWorking: !!activeWork,
        workSessionId: activeWork?._id,
        timeRemaining: activeWork
          ? Math.max(
              0,
              work.duration -
                Math.floor((Date.now() - activeWork.startedAt) / 1000)
            )
          : 0
      };
    });

    res.json({ ok: true, data: { works: worksWithStatus } });
  } catch (error) {
    console.error('Ошибка получения списка работ:', error);
    res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// Получение информации о конкретной работе
router.get('/:id', async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({ ok: false, error: 'Работа не найдена' });
    }

    res.json({ ok: true, data: { work } });
  } catch (error) {
    console.error('Ошибка получения работы:', error);
    res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// Начать работу
router.post('/:id/start', async (req, res) => {
  try {
    const userId = req.user.id;
    const workId = req.params.id;

    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ ok: false, error: 'Работа не найдена' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, error: 'Пользователь не найден' });
    }

    // Проверяем требования
    if (user.level < work.level) {
      return res
        .status(400)
        .json({ ok: false, error: 'Недостаточный уровень' });
    }

    if (user.energy < work.energyCost) {
      return res.status(400).json({ ok: false, error: 'Недостаточно энергии' });
    }

    if (user.respect < work.requirements.respect) {
      return res
        .status(400)
        .json({ ok: false, error: 'Недостаточно уважения' });
    }

    // Проверяем, не работает ли уже пользователь
    const activeWork = await UserWork.findOne({
      userId,
      status: 'working'
    });

    if (activeWork) {
      return res.status(400).json({ ok: false, error: 'Вы уже работаете' });
    }

    // Проверяем кулдаун
    const lastWork = await UserWork.findOne({
      userId,
      workId,
      status: { $in: ['completed', 'failed'] }
    }).sort({ completedAt: -1 });

    if (lastWork && work.cooldown > 0) {
      const timeSinceLastWork = Date.now() - lastWork.completedAt.getTime();
      const cooldownMs = work.cooldown * 1000;

      if (timeSinceLastWork < cooldownMs) {
        const remainingCooldown = Math.ceil(
          (cooldownMs - timeSinceLastWork) / 1000
        );
        return res.status(400).json({
          ok: false,
          error: `Кулдаун: ${remainingCooldown} секунд`
        });
      }
    }

    // Создаем сессию работы
    const userWork = new UserWork({
      userId,
      workId,
      status: 'working',
      startedAt: new Date()
    });

    await userWork.save();

    // Списываем энергию
    user.energy -= work.energyCost;
    await user.save();

    res.json({
      ok: true,
      message: `Начали работу: ${work.name}`,
      data: {
        workSession: userWork,
        timeRemaining: work.duration,
        newEnergy: user.energy
      }
    });
  } catch (error) {
    console.error('Ошибка начала работы:', error);
    res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// Завершить работу
router.post('/session/:sessionId/complete', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.sessionId;

    const userWork = await UserWork.findOne({
      _id: sessionId,
      userId,
      status: 'working'
    }).populate('workId');

    if (!userWork) {
      return res
        .status(404)
        .json({ ok: false, error: 'Сессия работы не найдена' });
    }

    const work = userWork.workId;
    const user = await User.findById(userId);

    // Проверяем, прошло ли достаточно времени
    const elapsedTime = Math.floor(
      (Date.now() - userWork.startedAt.getTime()) / 1000
    );

    if (elapsedTime < work.duration) {
      return res.status(400).json({
        ok: false,
        error: `Работа еще не завершена. Осталось: ${work.duration - elapsedTime} секунд`
      });
    }

    // Определяем успех работы
    const isSuccess = Math.random() * 100 <= work.successRate;

    if (isSuccess) {
      // Успешное завершение
      userWork.status = 'completed';
      userWork.completedAt = new Date();
      userWork.duration = elapsedTime;
      userWork.rewards = {
        money: work.moneyReward,
        exp: work.expReward
      };

      // Начисляем награды
      user.money += work.moneyReward;
      user.exp += work.expReward;

      // Проверяем повышение уровня
      const expToNextLevel = user.level * 100;
      if (user.exp >= expToNextLevel) {
        user.level += 1;
        user.exp -= expToNextLevel;
        user.energy = 100; // Полное восстановление энергии при повышении уровня
      }

      await user.save();
      await userWork.save();

      res.json({
        ok: true,
        message: `Работа "${work.name}" завершена успешно!`,
        data: {
          rewards: userWork.rewards,
          newLevel: user.level,
          newMoney: user.money,
          newExp: user.exp,
          leveledUp: user.level > 1
        }
      });
    } else {
      // Неудачное завершение
      userWork.status = 'failed';
      userWork.completedAt = new Date();
      userWork.duration = elapsedTime;
      userWork.penalties = {
        energyLoss: work.failurePenalty.energyLoss,
        moneyLoss: work.failurePenalty.moneyLoss
      };

      // Применяем штрафы
      user.energy = Math.max(0, user.energy - work.failurePenalty.energyLoss);
      user.money = Math.max(0, user.money - work.failurePenalty.moneyLoss);

      await user.save();
      await userWork.save();

      res.json({
        ok: true,
        message: `Работа "${work.name}" провалена!`,
        data: {
          penalties: userWork.penalties,
          newMoney: user.money,
          newEnergy: user.energy
        }
      });
    }
  } catch (error) {
    console.error('Ошибка завершения работы:', error);
    res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// Отменить работу
router.post('/session/:sessionId/cancel', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.sessionId;

    const userWork = await UserWork.findOne({
      _id: sessionId,
      userId,
      status: 'working'
    }).populate('workId');

    if (!userWork) {
      return res
        .status(404)
        .json({ ok: false, error: 'Сессия работы не найдена' });
    }

    const work = userWork.workId;
    const user = await User.findById(userId);

    // Возвращаем часть энергии (50%)
    const energyRefund = Math.floor(work.energyCost * 0.5);
    user.energy = Math.min(100, user.energy + energyRefund);

    userWork.status = 'cancelled';
    userWork.completedAt = new Date();

    await user.save();
    await userWork.save();

    res.json({
      ok: true,
      message: `Работа "${work.name}" отменена`,
      data: {
        energyRefund,
        newEnergy: user.energy
      }
    });
  } catch (error) {
    console.error('Ошибка отмены работы:', error);
    res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// Получить активные работы пользователя
router.get('/user/active', async (req, res) => {
  try {
    const userId = req.user.id;

    const activeWorks = await UserWork.find({
      userId,
      status: 'working'
    }).populate('workId');

    const worksWithTimeRemaining = activeWorks.map(userWork => {
      const work = userWork.workId;
      const elapsedTime = Math.floor(
        (Date.now() - userWork.startedAt.getTime()) / 1000
      );
      const timeRemaining = Math.max(0, work.duration - elapsedTime);

      return {
        ...userWork.toObject(),
        timeRemaining,
        progress: Math.min(100, (elapsedTime / work.duration) * 100)
      };
    });

    res.json({ ok: true, data: { activeWorks: worksWithTimeRemaining } });
  } catch (error) {
    console.error('Ошибка получения активных работ:', error);
    res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// Получить историю работ пользователя
router.get('/user/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const userWorks = await UserWork.find({
      userId,
      status: { $in: ['completed', 'failed', 'cancelled'] }
    })
      .populate('workId')
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserWork.countDocuments({
      userId,
      status: { $in: ['completed', 'failed', 'cancelled'] }
    });

    res.json({
      ok: true,
      data: {
        history: userWorks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения истории работ:', error);
    res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

export default router;
