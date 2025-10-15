import mongoose from 'mongoose';
import Item from '../models/Item.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const updateItemStats = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Обновляем предметы, оставляя только нужные параметры
    const updates = [
      {
        name: 'Кожаная куртка',
        stats: {
          damage: 0,
          defense: 0,
          energy: 0,
          health: 0,
          luck: 0
        }
      },
      {
        name: 'Боевые перчатки',
        stats: {
          damage: 5,
          defense: 0,
          energy: 0,
          health: 0,
          luck: 10
        }
      },
      {
        name: 'Кольцо силы',
        stats: {
          damage: 10,
          defense: 0,
          energy: 0,
          health: 0,
          luck: 0
        }
      }
    ];

    for (const update of updates) {
      const result = await Item.updateOne(
        { name: update.name },
        {
          $set: {
            stats: update.stats
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Обновлен предмет: ${update.name}`);
        console.log(
          `   Статы: урон=${update.stats.damage}, удача=${update.stats.luck}`
        );
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
