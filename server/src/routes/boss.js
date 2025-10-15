import express from 'express';
import Boss from '../models/Boss.js';

const router = express.Router();

// Получение списка всех боссов
router.get('/', async (req, res) => {
  try {
    const bosses = await Boss.find().sort({ level: 1 }).lean();

    res.json({
      ok: true,
      data: {
        bosses: bosses.map(boss => ({
          id: boss._id,
          name: boss.name,
          maxHp: boss.maxHp,
          currentHp: boss.currentHp,
          level: boss.level,
          rewards: boss.rewards,
          state: boss.state,
          participantCount: boss.participants.length,
          spawnAt: boss.spawnAt,
          defeatedAt: boss.defeatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Ошибка получения списка боссов:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения списка боссов'
    });
  }
});

// Получение информации о конкретном боссе
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const boss = await Boss.findById(id)
      .populate('participants.userId', 'nickname level')
      .lean();

    if (!boss) {
      return res.status(404).json({
        ok: false,
        error: 'Босс не найден'
      });
    }

    res.json({
      ok: true,
      data: {
        boss: {
          id: boss._id,
          name: boss.name,
          maxHp: boss.maxHp,
          currentHp: boss.currentHp,
          level: boss.level,
          rewards: boss.rewards,
          state: boss.state,
          participants: boss.participants.map(p => ({
            userId: p.userId._id,
            nickname: p.userId.nickname,
            level: p.userId.level,
            damageDealt: p.damageDealt,
            joinedAt: p.joinedAt
          })),
          spawnAt: boss.spawnAt,
          defeatedAt: boss.defeatedAt,
          createdAt: boss.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения информации о боссе:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения информации о боссе'
    });
  }
});

// Создание нового босса (админ функция)
router.post('/', async (req, res) => {
  try {
    const { name, maxHp, level, rewards } = req.body;

    if (!name || !maxHp || !level) {
      return res.status(400).json({
        ok: false,
        error: 'Имя, здоровье и уровень босса обязательны'
      });
    }

    const boss = new Boss({
      name,
      maxHp,
      currentHp: maxHp,
      level,
      rewards: rewards || { money: 0, exp: 0, items: [] }
    });

    await boss.save();

    res.status(201).json({
      ok: true,
      data: {
        boss: {
          id: boss._id,
          name: boss.name,
          maxHp: boss.maxHp,
          currentHp: boss.currentHp,
          level: boss.level,
          rewards: boss.rewards
        }
      }
    });
  } catch (error) {
    console.error('Ошибка создания босса:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка создания босса'
    });
  }
});

// Активация босса (админ функция)
router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const boss = await Boss.findById(id);
    if (!boss) {
      return res.status(404).json({
        ok: false,
        error: 'Босс не найден'
      });
    }

    if (boss.state !== 'idle') {
      return res.status(400).json({
        ok: false,
        error: 'Босс уже активен или мертв'
      });
    }

    boss.state = 'active';
    boss.currentHp = boss.maxHp;
    boss.participants = [];
    boss.defeatedAt = null;
    await boss.save();

    res.json({
      ok: true,
      data: {
        message: 'Босс активирован',
        boss: {
          id: boss._id,
          name: boss.name,
          currentHp: boss.currentHp,
          maxHp: boss.maxHp
        }
      }
    });
  } catch (error) {
    console.error('Ошибка активации босса:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка активации босса'
    });
  }
});

// Получение статистики боя с боссом
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const boss = await Boss.findById(id)
      .populate('participants.userId', 'nickname level')
      .lean();

    if (!boss) {
      return res.status(404).json({
        ok: false,
        error: 'Босс не найден'
      });
    }

    const totalDamage = boss.participants.reduce(
      (sum, p) => sum + p.damageDealt,
      0
    );
    const participantStats = boss.participants.map(p => ({
      nickname: p.userId.nickname,
      level: p.userId.level,
      damageDealt: p.damageDealt,
      damagePercentage:
        totalDamage > 0 ? ((p.damageDealt / totalDamage) * 100).toFixed(2) : 0,
      joinedAt: p.joinedAt
    }));

    res.json({
      ok: true,
      data: {
        bossName: boss.name,
        totalDamage,
        participantCount: boss.participants.length,
        participantStats: participantStats.sort(
          (a, b) => b.damageDealt - a.damageDealt
        ),
        battleDuration: boss.defeatedAt
          ? Math.floor((boss.defeatedAt - boss.createdAt) / 1000)
          : Math.floor((Date.now() - boss.createdAt) / 1000)
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики боя:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения статистики боя'
    });
  }
});

export default router;
