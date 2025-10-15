import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Boss from '../models/Boss.js';

dotenv.config({ path: '../../.env' });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const seedBosses = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено');

    // Удаляем существующих боссов
    await Boss.deleteMany({});
    console.log('🗑️ Существующие боссы удалены');

    const bosses = [
      {
        name: 'Тюремный Босс',
        maxHp: 1000,
        currentHp: 1000,
        level: 1,
        state: 'active',
        rewards: {
          money: 5000,
          exp: 1000,
          items: []
        },
        spawnAt: new Date()
      },
      {
        name: 'Главарь Банды',
        maxHp: 5000,
        currentHp: 5000,
        level: 5,
        state: 'active',
        rewards: {
          money: 25000,
          exp: 5000,
          items: []
        },
        spawnAt: new Date()
      },
      {
        name: 'Смотрящий',
        maxHp: 15000,
        currentHp: 15000,
        level: 10,
        state: 'active',
        rewards: {
          money: 75000,
          exp: 15000,
          items: []
        },
        spawnAt: new Date()
      },
      {
        name: 'Авторитет',
        maxHp: 50000,
        currentHp: 50000,
        level: 20,
        state: 'active',
        rewards: {
          money: 250000,
          exp: 50000,
          items: []
        },
        spawnAt: new Date()
      },
      {
        name: 'Начальник Тюрьмы',
        maxHp: 150000,
        currentHp: 150000,
        level: 50,
        state: 'active',
        rewards: {
          money: 1000000,
          exp: 200000,
          items: []
        },
        spawnAt: new Date()
      }
    ];

    const createdBosses = await Boss.insertMany(bosses);
    console.log(`✅ Создано ${createdBosses.length} боссов:`);

    createdBosses.forEach(boss => {
      console.log(`\n👹 ${boss.name}`);
      console.log(`   Уровень: ${boss.level}`);
      console.log(`   HP: ${boss.maxHp}`);
      console.log(`   Награды:`);
      console.log(`     💰 Деньги: ${boss.rewards.money.toLocaleString('ru-RU')}`);
      console.log(`     ✨ Опыт: ${boss.rewards.exp.toLocaleString('ru-RU')}`);
      console.log(`   ID: ${boss._id}`);
    });

    console.log('\n📊 Итого:');
    console.log(`   Всего боссов: ${createdBosses.length}`);
    console.log(`   Все боссы активны и готовы к бою!`);
  } catch (error) {
    console.error('❌ Ошибка при создании боссов:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Отключение от MongoDB');
  }
};

seedBosses();

