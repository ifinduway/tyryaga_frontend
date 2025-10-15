import mongoose from 'mongoose';
import Item from '../models/Item.js';
import UserInventory from '../models/UserInventory.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const clearAllItems = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Удаляем все предметы из магазина
    const itemsResult = await Item.deleteMany({});
    console.log(
      `🗑️ Удалено предметов из магазина: ${itemsResult.deletedCount}`
    );

    // Очищаем все инвентари
    const inventoryResult = await UserInventory.updateMany(
      {},
      { $set: { items: [] } }
    );
    console.log(`🎒 Очищено инвентарей: ${inventoryResult.modifiedCount}`);

    console.log('✅ Все предметы успешно удалены!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
  }
};

clearAllItems();
