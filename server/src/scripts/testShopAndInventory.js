import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Item from '../models/Item.js';
import UserInventory from '../models/UserInventory.js';

dotenv.config({ path: '../../.env' });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const testShopAndInventory = async nickname => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено\n');

    // Находим пользователя
    const user = await User.findOne({ nickname });
    if (!user) {
      console.log(`❌ Пользователь "${nickname}" не найден`);
      return;
    }

    console.log('👤 Информация о пользователе:');
    console.log(`   Имя: ${user.nickname}`);
    console.log(`   Уровень: ${user.level}`);
    console.log(`   Деньги: ${user.money.toLocaleString('ru-RU')} 💰`);
    console.log(`   Опыт: ${user.exp.toLocaleString('ru-RU')} ✨`);
    console.log(`   Энергия: ${user.energy.toLocaleString('ru-RU')} ⚡`);

    // Проверяем доступные предметы
    console.log('\n🛒 Доступные предметы в магазине:');
    const items = await Item.find().sort({ type: 1, level: 1 }).limit(10);

    if (items.length === 0) {
      console.log('   ⚠️  Предметы не найдены. Запустите: npm run seed:items');
      return;
    }

    console.log(`   Всего предметов: ${await Item.countDocuments()}`);
    console.log('\n   Примеры предметов:');
    items.slice(0, 5).forEach(item => {
      const rarityEmoji = {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🟠'
      };
      console.log(
        `   ${rarityEmoji[item.rarity]} ${item.name} (${item.type}, Ур.${item.level})`
      );
      console.log(`      💰 Цена: ${item.price.toLocaleString('ru-RU')}`);
      console.log(`      📊 Характеристики: ${JSON.stringify(item.stats)}`);
    });

    // Проверяем инвентарь пользователя
    console.log('\n🎒 Инвентарь пользователя:');
    const userInventory = await UserInventory.findOne({
      userId: user._id
    }).populate('items.itemId');

    if (!userInventory || userInventory.items.length === 0) {
      console.log('   📦 Инвентарь пуст');
      console.log('   💡 Купите предметы в игре для проверки');
    } else {
      console.log(`   Всего предметов: ${userInventory.items.length}`);
      console.log(
        `   Максимум слотов: ${userInventory.maxSlots || 'не указано'}`
      );
      console.log('\n   Список предметов:');

      let totalValue = 0;
      for (const invItem of userInventory.items) {
        if (!invItem.itemId) continue;

        const item = invItem.itemId;
        const rarityEmoji = {
          common: '⚪',
          uncommon: '🟢',
          rare: '🔵',
          epic: '🟣',
          legendary: '🟠'
        };

        console.log(
          `\n   ${rarityEmoji[item.rarity]} ${item.name} ${invItem.equipped ? '🔧 (Экипировано)' : ''}`
        );
        console.log(`      Тип: ${item.type}`);
        console.log(`      Уровень: ${item.level}`);
        console.log(`      Редкость: ${item.rarity}`);
        console.log(`      Количество: ${invItem.quantity}`);
        if (invItem.equipped) {
          console.log(`      Слот: ${invItem.slot || 'не указан'}`);
        }
        console.log(`      Характеристики: ${JSON.stringify(item.stats)}`);
        console.log(
          `      Стоимость: ${item.price.toLocaleString('ru-RU')} 💰`
        );
        console.log(
          `      Продажа: ${item.sellPrice.toLocaleString('ru-RU')} 💰`
        );

        totalValue += item.sellPrice * invItem.quantity;
      }

      console.log('\n   📊 Статистика инвентаря:');
      console.log(`      Всего предметов: ${userInventory.items.length}`);
      console.log(
        `      Экипировано: ${userInventory.items.filter(i => i.equipped).length}`
      );
      console.log(
        `      Общая стоимость продажи: ${totalValue.toLocaleString('ru-RU')} 💰`
      );
    }

    // Проверяем, что можно купить
    console.log('\n💡 Рекомендации:');
    const affordableItems = await Item.find({
      price: { $lte: user.money },
      level: { $lte: user.level }
    })
      .sort({ price: -1 })
      .limit(3);

    if (affordableItems.length > 0) {
      console.log(
        `   Вы можете купить ${affordableItems.length} предметов:`
      );
      affordableItems.forEach(item => {
        console.log(`   - ${item.name} за ${item.price.toLocaleString('ru-RU')} 💰`);
      });
    } else {
      console.log('   Недостаточно денег для покупки предметов');
      console.log('   Заработайте деньги через работу или победу над боссами');
    }

    // Тестирование покупки (симуляция)
    console.log('\n🧪 Тест покупки предмета:');
    const testItem = await Item.findOne({ price: { $lte: user.money } });

    if (testItem) {
      console.log(`   Попытка купить: ${testItem.name}`);
      console.log(`   Цена: ${testItem.price.toLocaleString('ru-RU')} 💰`);
      console.log(
        `   Баланс до покупки: ${user.money.toLocaleString('ru-RU')} 💰`
      );

      const newBalance = user.money - testItem.price;
      console.log(`   Баланс после покупки: ${newBalance.toLocaleString('ru-RU')} 💰`);

      // Проверяем, есть ли уже в инвентаре
      const existingUserInv = await UserInventory.findOne({
        userId: user._id
      });

      if (existingUserInv) {
        const existingItem = existingUserInv.items.find(
          i => i.itemId.toString() === testItem._id.toString()
        );

        if (existingItem) {
          console.log(
            `   ✅ Предмет уже в инвентаре (количество: ${existingItem.quantity})`
          );
          console.log(
            `   После покупки будет: ${existingItem.quantity + 1} шт.`
          );
        } else {
          console.log('   ✅ Предмет будет добавлен в инвентарь (новый)');
        }
      } else {
        console.log(
          '   ✅ Инвентарь будет создан и предмет добавлен'
        );
      }

      console.log('\n   💡 Для реальной покупки используйте API или игру');
    } else {
      console.log('   ⚠️  Нет доступных предметов для покупки');
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке магазина:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Отключение от MongoDB');
  }
};

// Получаем аргументы из командной строки
const nickname = process.argv[2] || 'fuway';

console.log(`🔍 Проверка магазина и инвентаря для: ${nickname}\n`);
testShopAndInventory(nickname);

