import mongoose from 'mongoose';
import Item from '../models/Item.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const addMoreItems = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    const items = [
      {
        name: 'Кожаная куртка',
        description: 'Прочная куртка из кожи, дает защиту',
        type: 'body',
        rarity: 'common',
        level: 1,
        stats: {
          damage: 0,
          defense: 15,
          energy: 0,
          health: 0,
          luck: 0
        },
        price: 2000,
        sellPrice: 1000,
        stackable: false,
        maxStack: 1,
        consumable: false,
        effects: [],
        icon: '👕'
      },
      {
        name: 'Боевые перчатки',
        description: 'Перчатки, увеличивающие точность ударов',
        type: 'gloves',
        rarity: 'uncommon',
        level: 3,
        stats: {
          damage: 5,
          defense: 8,
          energy: 0,
          health: 0,
          luck: 10
        },
        price: 8000,
        sellPrice: 4000,
        stackable: false,
        maxStack: 1,
        consumable: false,
        effects: [],
        icon: '🧤'
      },
      {
        name: 'Кольцо силы',
        description: 'Магическое кольцо, увеличивающее урон',
        type: 'ring',
        rarity: 'rare',
        level: 7,
        stats: {
          damage: 10,
          defense: 0,
          energy: 0,
          health: 0,
          luck: 0
        },
        price: 25000,
        sellPrice: 12500,
        stackable: false,
        maxStack: 1,
        consumable: false,
        effects: [],
        icon: '💍'
      }
    ];

    for (const itemData of items) {
      const item = new Item(itemData);
      await item.save();
      console.log(
        `✅ Добавлен предмет: ${item.name} (${item.type}, ${item.rarity})`
      );
    }

    console.log('✅ Все дополнительные предметы добавлены!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
  }
};

addMoreItems();
