import mongoose from 'mongoose';
import UserInventory from '../models/UserInventory.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const fixInventorySlots = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Находим все инвентари с устаревшими слотами
    const inventories = await UserInventory.find({
      'items.slot': { $in: ['armor'] }
    });

    console.log(
      `🔍 Найдено инвентарей с устаревшими слотами: ${inventories.length}`
    );

    for (const inventory of inventories) {
      // Обновляем слоты armor на соответствующие новые слоты
      for (const item of inventory.items) {
        if (item.slot === 'armor') {
          // Определяем новый слот на основе типа предмета
          if (item.itemId && item.itemId.type) {
            const slotMapping = {
              helmet: 'helmet',
              boots: 'boots',
              body: 'body',
              gloves: 'gloves',
              weapon: 'weapon',
              ring: 'ring'
            };

            const newSlot = slotMapping[item.itemId.type];
            if (newSlot) {
              item.slot = newSlot;
              console.log(
                `🔄 Обновлен слот: ${item.itemId.name} (${item.itemId.type}) -> ${newSlot}`
              );
            } else {
              // Если тип не определен, снимаем предмет
              item.equipped = false;
              item.slot = null;
              console.log(
                `❌ Снят предмет с неизвестным типом: ${item.itemId?.name || 'Unknown'}`
              );
            }
          } else {
            // Если нет информации о предмете, снимаем его
            item.equipped = false;
            item.slot = null;
            console.log(`❌ Снят предмет без данных`);
          }
        }
      }

      await inventory.save();
    }

    console.log('✅ Исправление слотов завершено!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
  }
};

fixInventorySlots();
