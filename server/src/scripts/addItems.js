import mongoose from 'mongoose';
import Item from '../models/Item.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const addItems = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    const items = [
      {
        name: 'Пушка',
        description: 'Мощное оружие, увеличивающее базовый урон в 2 раза',
        type: 'weapon',
        rarity: 'rare',
        level: 1,
        stats: {
          damage: 0, // Бонус урона будет рассчитан в коде
          defense: 0,
          energy: 0,
          health: 0,
          luck: 0
        },
        price: 5000,
        sellPrice: 2500,
        stackable: false,
        maxStack: 1,
        consumable: false,
        effects: [
          {
            type: 'damage_boost',
            value: 2, // x2 урон
            duration: 0 // постоянный эффект
          }
        ],
        icon: '🔫'
      },
      {
        name: 'КритШлем',
        description: 'Шлем, увеличивающий шанс критического урона на 50%',
        type: 'armor',
        rarity: 'epic',
        level: 5,
        stats: {
          damage: 0,
          defense: 10,
          energy: 0,
          health: 0,
          luck: 50 // +50% к шансу крита
        },
        price: 15000,
        sellPrice: 7500,
        stackable: false,
        maxStack: 1,
        consumable: false,
        effects: [
          {
            type: 'luck_boost',
            value: 50,
            duration: 0
          }
        ],
        icon: '⛑️'
      },
      {
        name: 'КритБоты',
        description:
          'Ботинки, увеличивающие множитель критического урона в 3 раза',
        type: 'armor',
        rarity: 'legendary',
        level: 10,
        stats: {
          damage: 0,
          defense: 5,
          energy: 0,
          health: 0,
          luck: 0
        },
        price: 50000,
        sellPrice: 25000,
        stackable: false,
        maxStack: 1,
        consumable: false,
        effects: [
          {
            type: 'damage_boost',
            value: 3, // x3 крит урон
            duration: 0
          }
        ],
        icon: '👢'
      },
      {
        name: 'Хлiб',
        description: 'Свежий хлеб, восстанавливающий 100 энергии',
        type: 'consumable',
        rarity: 'common',
        level: 1,
        stats: {
          damage: 0,
          defense: 0,
          energy: 0,
          health: 0,
          luck: 0
        },
        price: 100,
        sellPrice: 50,
        stackable: true,
        maxStack: 99,
        consumable: true,
        effects: [
          {
            type: 'energy_restore',
            value: 100,
            duration: 0
          }
        ],
        icon: '🍞'
      }
    ];

    for (const itemData of items) {
      const item = new Item(itemData);
      await item.save();
      console.log(`✅ Добавлен предмет: ${item.name} (${item.rarity})`);
    }

    console.log('✅ Все предметы успешно добавлены!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
  }
};

addItems();
