import mongoose from 'mongoose';
import Item from '../models/Item.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const updateItemStats = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Обновляем предметы с новыми статами
    const updates = [
      {
        name: 'Кожаная куртка',
        stats: {
          damage: 0,
          luck: 15 // +15% шанс крита
        },
        effects: [
          { type: 'damage_boost', value: 2, duration: 0 } // x2 множитель крит урона
        ]
      },
      {
        name: 'Кольцо силы',
        stats: {
          damage: 55, // +55 базовый урон
          luck: 0
        },
        effects: []
      }
    ];

    for (const update of updates) {
      const result = await Item.updateOne(
        { name: update.name },
        {
          $set: {
            stats: update.stats,
            effects: update.effects
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Обновлен предмет: ${update.name}`);
        console.log(
          `   Статы: урон=${update.stats.damage}, удача=${update.stats.luck}%`
        );
        if (update.effects.length > 0) {
          console.log(
            `   Эффекты: ${update.effects.map(e => `${e.type}=${e.value}`).join(', ')}`
          );
        }
      } else {
        console.log(`⚠️ Предмет не найден: ${update.name}`);
      }
    }

    console.log('✅ Обновление статов предметов завершено!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
  }
};

updateItemStats();
