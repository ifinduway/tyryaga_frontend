import express from 'express';
import Item from '../models/Item.js';
import UserInventory from '../models/UserInventory.js';
import User from '../models/User.js';

const router = express.Router();

// Получение всех предметов (магазин)
router.get('/', async (req, res) => {
  try {
    const { type, rarity, level, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (rarity) filter.rarity = rarity;
    if (level) filter.level = { $lte: parseInt(level) };

    const items = await Item.find(filter)
      .sort({ level: 1, rarity: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Item.countDocuments(filter);

    res.json({
      ok: true,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения предметов:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения предметов'
    });
  }
});

// Получение конкретного предмета
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        ok: false,
        error: 'Предмет не найден'
      });
    }

    res.json({
      ok: true,
      data: { item }
    });
  } catch (error) {
    console.error('Ошибка получения предмета:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения предмета'
    });
  }
});

// Покупка предмета
router.post('/:id/buy', async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const userId = req.user.id;

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        ok: false,
        error: 'Предмет не найден'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'Пользователь не найден'
      });
    }

    const totalCost = item.price * quantity;

    if (user.money < totalCost) {
      return res.status(400).json({
        ok: false,
        error: 'Недостаточно денег'
      });
    }

    if (user.level < item.level) {
      return res.status(400).json({
        ok: false,
        error: 'Недостаточный уровень для покупки этого предмета'
      });
    }

    // Списываем деньги
    user.money -= totalCost;
    await user.save();

    // Добавляем предмет в инвентарь
    let inventory = await UserInventory.findOne({ userId });
    if (!inventory) {
      inventory = new UserInventory({ userId, items: [] });
    }

    await inventory.addItem(item._id, quantity);

    res.json({
      ok: true,
      data: {
        message: 'Предмет успешно куплен',
        item: {
          id: item._id,
          name: item.name,
          quantity: quantity
        },
        newBalance: user.money
      }
    });
  } catch (error) {
    console.error('Ошибка покупки предмета:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка покупки предмета'
    });
  }
});

// Получение инвентаря пользователя
router.get('/inventory/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const inventory = await UserInventory.findOne({ userId })
      .populate('items.itemId')
      .lean();

    if (!inventory) {
      return res.json({
        ok: true,
        data: {
          inventory: {
            items: [],
            maxSlots: 20
          }
        }
      });
    }

    res.json({
      ok: true,
      data: { inventory }
    });
  } catch (error) {
    console.error('Ошибка получения инвентаря:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка получения инвентаря'
    });
  }
});

// Экипировка предмета
router.post('/:id/equip', async (req, res) => {
  try {
    const { slot } = req.body;
    const userId = req.user.id;
    const itemId = req.params.id;

    if (!slot) {
      return res.status(400).json({
        ok: false,
        error: 'Не указан слот для экипировки'
      });
    }

    const inventory = await UserInventory.findOne({ userId });
    if (!inventory) {
      return res.status(404).json({
        ok: false,
        error: 'Инвентарь не найден'
      });
    }

    // Проверяем, что предмет существует и принадлежит пользователю
    const ownedItem = inventory.items.find(
      i => i.itemId.toString() === itemId.toString()
    );
    if (!ownedItem) {
      return res
        .status(404)
        .json({ ok: false, error: 'У вас нет этого предмета' });
    }

    // Валидируем соответствие слота типу предмета (оружие → weapon, броня → armor)
    const itemDoc = await Item.findById(itemId);
    if (!itemDoc) {
      return res.status(404).json({ ok: false, error: 'Предмет не найден' });
    }

    if (itemDoc.type === 'consumable') {
      return res
        .status(400)
        .json({ ok: false, error: 'Расходники нельзя экипировать' });
    }

    const allowedSlotByType = { weapon: 'weapon', armor: 'armor' };
    const expectedSlot = allowedSlotByType[itemDoc.type];
    if (!expectedSlot || expectedSlot !== slot) {
      return res
        .status(400)
        .json({ ok: false, error: 'Неверный слот для данного типа предмета' });
    }

    await inventory.equipItem(itemId, slot);

    res.json({
      ok: true,
      data: {
        message: 'Предмет экипирован'
      }
    });
  } catch (error) {
    console.error('Ошибка экипировки предмета:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка экипировки предмета'
    });
  }
});

// Снятие предмета
router.post('/:id/unequip', async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const inventory = await UserInventory.findOne({ userId });
    if (!inventory) {
      return res.status(404).json({
        ok: false,
        error: 'Инвентарь не найден'
      });
    }

    await inventory.unequipItem(itemId);

    res.json({
      ok: true,
      data: {
        message: 'Предмет снят'
      }
    });
  } catch (error) {
    console.error('Ошибка снятия предмета:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка снятия предмета'
    });
  }
});

// Использование расходника
router.post('/:id/use', async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const inventory = await UserInventory.findOne({ userId }).populate(
      'items.itemId'
    );

    if (!inventory) {
      return res.status(404).json({
        ok: false,
        error: 'Инвентарь не найден'
      });
    }

    const inventoryItem = inventory.items.find(
      item => item.itemId._id.toString() === itemId
    );

    if (!inventoryItem) {
      return res.status(404).json({
        ok: false,
        error: 'Предмет не найден в инвентаре'
      });
    }

    if (!inventoryItem.itemId.consumable) {
      return res.status(400).json({
        ok: false,
        error: 'Этот предмет нельзя использовать'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'Пользователь не найден'
      });
    }

    // Применяем эффекты предмета
    const item = inventoryItem.itemId;
    let effectsApplied = [];

    for (const effect of item.effects || []) {
      switch (effect.type) {
        case 'health_restore':
          user.energy = Math.min(1000000, user.energy + effect.value);
          effectsApplied.push(`Восстановлено ${effect.value} энергии`);
          break;
        case 'energy_restore':
          user.energy = Math.min(1000000, user.energy + effect.value);
          effectsApplied.push(`Восстановлено ${effect.value} энергии`);
          break;
        // Добавить другие эффекты по необходимости
      }
    }

    await user.save();

    // Удаляем предмет из инвентаря
    await inventory.removeItem(itemId, 1);

    res.json({
      ok: true,
      data: {
        message: 'Предмет использован',
        effects: effectsApplied,
        newStats: {
          energy: user.energy
        }
      }
    });
  } catch (error) {
    console.error('Ошибка использования предмета:', error);
    res.status(500).json({
      ok: false,
      error: 'Ошибка использования предмета'
    });
  }
});

// Список экипированных предметов и агрегированных статов
router.get('/inventory/me/equipped', async (req, res) => {
  try {
    const userId = req.user.id;
    const inventory = await UserInventory.findOne({ userId }).populate(
      'items.itemId'
    );

    if (!inventory) {
      return res.json({ ok: true, data: { equipped: [], stats: {} } });
    }

    const equipped = inventory.items.filter(i => i.equipped && i.itemId);

    // Агрегируем статы экипированных предметов
    const baseStats = { damage: 0, defense: 0, energy: 0, health: 0, luck: 0 };
    const stats = equipped.reduce((acc, invItem) => {
      const s = invItem.itemId.stats || {};
      acc.damage += s.damage || 0;
      acc.defense += s.defense || 0;
      acc.energy += s.energy || 0;
      acc.health += s.health || 0;
      acc.luck += s.luck || 0;
      return acc;
    }, baseStats);

    res.json({ ok: true, data: { equipped, stats } });
  } catch (error) {
    console.error('Ошибка получения экипированных предметов:', error);
    res
      .status(500)
      .json({ ok: false, error: 'Ошибка получения экипированных предметов' });
  }
});

export default router;
