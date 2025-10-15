import express from 'express';
import BossTemplate from '../models/BossTemplate.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получение списка всех шаблонов боссов (с фильтрацией по уровню игрока)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const templates = await BossTemplate.find({ isActive: true })
      .sort({ requiredLevel: 1, level: 1 })
      .lean();

    res.json({
      ok: true,
      data: {
        templates: templates.map(template => ({
          id: template._id,
          name: template.name,
          description: template.description,
          maxHp: template.maxHp,
          level: template.level,
          requiredLevel: template.requiredLevel,
          rewards: template.rewards,
          instanceDuration: template.instanceDuration,
          isAvailable: user.level >= template.requiredLevel,
          stats: template.stats
        }))
      }
    });
  } catch (error) {
    console.error('Ошибка получения списка шаблонов боссов:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения списка шаблонов боссов'
    });
  }
});

// Получение информации о конкретном шаблоне
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const template = await BossTemplate.findById(id).lean();

    if (!template) {
      return res.status(404).json({
        ok: false,
        error: 'Шаблон босса не найден'
      });
    }

    // Получаем статистику игрока по этому боссу
    const userStats = user.bossStats?.get(id) || {
      kills: 0,
      attempts: 0,
      bestTime: 0,
      lastKilledAt: null
    };

    res.json({
      ok: true,
      data: {
        template: {
          id: template._id,
          name: template.name,
          description: template.description,
          maxHp: template.maxHp,
          level: template.level,
          requiredLevel: template.requiredLevel,
          rewards: template.rewards,
          instanceDuration: template.instanceDuration,
          isAvailable: user.level >= template.requiredLevel,
          stats: template.stats,
          userStats
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения информации о шаблоне босса:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения информации о шаблоне босса'
    });
  }
});

// Создание нового шаблона (админ функция)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      maxHp,
      level,
      requiredLevel,
      rewards,
      instanceDuration
    } = req.body;

    if (!name || !maxHp || !level || !requiredLevel) {
      return res.status(400).json({
        ok: false,
        error: 'Имя, здоровье, уровень и требуемый уровень обязательны'
      });
    }

    const template = new BossTemplate({
      name,
      description,
      maxHp,
      level,
      requiredLevel,
      rewards: rewards || { money: 0, exp: 0, items: [] },
      instanceDuration: instanceDuration || 30 * 60 * 1000
    });

    await template.save();

    res.status(201).json({
      ok: true,
      data: {
        template: {
          id: template._id,
          name: template.name,
          description: template.description,
          maxHp: template.maxHp,
          level: template.level,
          requiredLevel: template.requiredLevel,
          rewards: template.rewards,
          instanceDuration: template.instanceDuration
        }
      }
    });
  } catch (error) {
    console.error('Ошибка создания шаблона босса:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка создания шаблона босса'
    });
  }
});

// Получение глобальной статистики по шаблону
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await BossTemplate.findById(id)
      .populate('stats.fastestKillBy', 'nickname level')
      .lean();

    if (!template) {
      return res.status(404).json({
        ok: false,
        error: 'Шаблон босса не найден'
      });
    }

    res.json({
      ok: true,
      data: {
        bossName: template.name,
        stats: {
          totalKills: template.stats.totalKills,
          totalAttempts: template.stats.totalAttempts,
          averageKillTime: template.stats.averageKillTime,
          fastestKillTime: template.stats.fastestKillTime,
          fastestKillBy: template.stats.fastestKillBy
            ? {
                id: template.stats.fastestKillBy._id,
                nickname: template.stats.fastestKillBy.nickname,
                level: template.stats.fastestKillBy.level
              }
            : null
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики шаблона босса:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения статистики шаблона босса'
    });
  }
});

export default router;
