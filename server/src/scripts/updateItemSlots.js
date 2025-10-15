import mongoose from 'mongoose';
import Item from '../models/Item.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const updateExistingItems = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Обновляем существующие предметы
    const updates = [
      {
        name: 'КритШлем',
        type: 'helmet',
        stats: {
          damage: 0,
          defense: 10,
          energy: 0,
          health: 0,
          luck: 50
        }
      },
      {
        name: 'КритБоты',
        type: 'boots',
        stats: {
          damage: 0,
          defense: 5,
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
            type: update.type,
            stats: update.stats
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Обновлен предмет: ${update.name} -> ${update.type}`);
      } else {
        console.log(`⚠️ Предмет не найден: ${update.name}`);
      }
    }

    console.log('✅ Обновление предметов завершено!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
  }
};

updateExistingItems();
