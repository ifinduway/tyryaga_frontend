import mongoose from 'mongoose';
import Item from '../models/Item.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const cleanItemStats = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Обновляем все предметы, убирая лишние статы
    const items = await Item.find({});

    for (const item of items) {
      const newStats = {
        damage: item.stats?.damage || 0,
        energy: item.stats?.energy || 0
      };

      await Item.updateOne({ _id: item._id }, { $set: { stats: newStats } });

      console.log(`✅ Обновлен предмет: ${item.name}`);
      console.log(
        `   Статы: урон=${newStats.damage}, энергия=${newStats.energy}`
      );
    }

    console.log('✅ Очистка статов предметов завершена!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
  }
};

cleanItemStats();
