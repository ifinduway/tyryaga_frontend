import mongoose from 'mongoose';
import Item from '../models/Item.js';
import dotenv from 'dotenv';

dotenv.config();

const items = [
  // Оружие
  {
    name: 'Нож из фольги',
    description: 'Обычный нож, сделанный из фольги. Лучше чем ничего.',
    type: 'weapon',
    rarity: 'common',
    level: 1,
    stats: { damage: 5 },
    price: 50,
    sellPrice: 25,
    icon: '🔪'
  },
  {
    name: 'Заточка',
    description: 'Острое лезвие, спрятанное в зубной щетке.',
    type: 'weapon',
    rarity: 'uncommon',
    level: 3,
    stats: { damage: 12 },
    price: 200,
    sellPrice: 100,
    icon: '🗡️'
  },
  {
    name: 'Цепь от унитаза',
    description: 'Тяжелая цепь, отличное оружие ближнего боя.',
    type: 'weapon',
    rarity: 'rare',
    level: 5,
    stats: { damage: 25 },
    price: 500,
    sellPrice: 250,
    icon: '⛓️'
  },
  {
    name: 'Самодельный шип',
    description: 'Острое оружие, сделанное из подручных материалов.',
    type: 'weapon',
    rarity: 'epic',
    level: 8,
    stats: { damage: 40 },
    price: 1000,
    sellPrice: 500,
    icon: '🔱'
  },
  {
    name: 'Легендарная заточка',
    description: 'Мифическое оружие, передаваемое из поколения в поколение.',
    type: 'weapon',
    rarity: 'legendary',
    level: 10,
    stats: { damage: 60 },
    price: 2500,
    sellPrice: 1250,
    icon: '⚔️'
  },

  // Броня
  {
    name: 'Картонная броня',
    description: 'Броня из картонных коробок. Лучше чем ничего.',
    type: 'armor',
    rarity: 'common',
    level: 1,
    stats: { defense: 3 },
    price: 30,
    sellPrice: 15,
    icon: '📦'
  },
  {
    name: 'Одеяло-щит',
    description: 'Толстое одеяло, которое может защитить от ударов.',
    type: 'armor',
    rarity: 'uncommon',
    level: 3,
    stats: { defense: 8 },
    price: 150,
    sellPrice: 75,
    icon: '🛡️'
  },
  {
    name: 'Самодельная броня',
    description: 'Броня, собранная из различных материалов.',
    type: 'armor',
    rarity: 'rare',
    level: 5,
    stats: { defense: 15 },
    price: 400,
    sellPrice: 200,
    icon: '🛡️'
  },
  {
    name: 'Тюремная броня',
    description: 'Прочная броня, сделанная в тюрьме.',
    type: 'armor',
    rarity: 'epic',
    level: 8,
    stats: { defense: 25 },
    price: 800,
    sellPrice: 400,
    icon: '🛡️'
  },
  {
    name: 'Легендарная броня',
    description: 'Мифическая броня, защищающая от всех напастей.',
    type: 'armor',
    rarity: 'legendary',
    level: 10,
    stats: { defense: 40 },
    price: 2000,
    sellPrice: 1000,
    icon: '🛡️'
  },

  // Расходники
  {
    name: 'Хлеб',
    description: 'Обычный хлеб. Восстанавливает немного энергии.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    stats: {},
    price: 10,
    sellPrice: 5,
    stackable: true,
    maxStack: 50,
    consumable: true,
    effects: [{ type: 'energy_restore', value: 10, duration: 0 }],
    icon: '🍞'
  },
  {
    name: 'Вода',
    description: 'Чистая вода. Восстанавливает энергию.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    stats: {},
    price: 5,
    sellPrice: 2,
    stackable: true,
    maxStack: 100,
    consumable: true,
    effects: [{ type: 'energy_restore', value: 5, duration: 0 }],
    icon: '💧'
  },
  {
    name: 'Энергетик',
    description: 'Самодельный энергетик. Дает большой заряд энергии.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 3,
    stats: {},
    price: 50,
    sellPrice: 25,
    stackable: true,
    maxStack: 20,
    consumable: true,
    effects: [{ type: 'energy_restore', value: 30, duration: 0 }],
    icon: '🥤'
  },
  {
    name: 'Аптечка',
    description: 'Самодельная аптечка. Восстанавливает здоровье.',
    type: 'consumable',
    rarity: 'rare',
    level: 5,
    stats: {},
    price: 100,
    sellPrice: 50,
    stackable: true,
    maxStack: 10,
    consumable: true,
    effects: [{ type: 'health_restore', value: 50, duration: 0 }],
    icon: '🏥'
  },
  {
    name: 'Стимулятор',
    description: 'Мощный стимулятор. Временно увеличивает урон.',
    type: 'consumable',
    rarity: 'epic',
    level: 8,
    stats: {},
    price: 300,
    sellPrice: 150,
    stackable: true,
    maxStack: 5,
    consumable: true,
    effects: [{ type: 'damage_boost', value: 20, duration: 30 }],
    icon: '💉'
  }
];

async function seedItems() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga'
    );
    console.log('✅ Подключение к MongoDB установлено');

    // Очищаем существующие предметы
    await Item.deleteMany({});
    console.log('🗑️ Существующие предметы удалены');

    // Создаем новые предметы
    const createdItems = await Item.insertMany(items);
    console.log(`✅ Создано ${createdItems.length} предметов`);

    // Выводим статистику по редкости
    const rarityStats = {};
    createdItems.forEach(item => {
      rarityStats[item.rarity] = (rarityStats[item.rarity] || 0) + 1;
    });

    console.log('📊 Статистика по редкости:');
    Object.entries(rarityStats).forEach(([rarity, count]) => {
      console.log(`  ${rarity}: ${count} предметов`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при заполнении предметов:', error);
    process.exit(1);
  }
}

seedItems();
