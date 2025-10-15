import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Work from '../models/Work.js';

dotenv.config({ path: '../../.env' });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const seedWorks = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено');

    await Work.deleteMany({});
    console.log('🗑️ Существующие работы удалены');

    const works = [
      // Уровень 1 - Простые работы
      {
        name: 'Мытье полов',
        description: 'Простая работа по уборке. Не требует особых навыков.',
        level: 1,
        energyCost: 10,
        moneyReward: 20,
        expReward: 5,
        duration: 30, // 30 секунд
        category: 'manual',
        icon: '🧽',
        successRate: 95
      },
      {
        name: 'Раздача еды',
        description: 'Помощь на кухне - раздача еды заключенным.',
        level: 1,
        energyCost: 15,
        moneyReward: 30,
        expReward: 8,
        duration: 45,
        category: 'manual',
        icon: '🍽️',
        successRate: 90
      },
      {
        name: 'Сортировка мусора',
        description: 'Сортировка и утилизация отходов.',
        level: 1,
        energyCost: 20,
        moneyReward: 40,
        expReward: 10,
        duration: 60,
        category: 'manual',
        icon: '♻️',
        successRate: 85
      },

      // Уровень 2-3 - Работы средней сложности
      {
        name: 'Ремонт мебели',
        description: 'Восстановление сломанной мебели в камерах.',
        level: 2,
        energyCost: 25,
        moneyReward: 60,
        expReward: 15,
        duration: 90,
        category: 'manual',
        icon: '🔨',
        successRate: 80,
        requirements: { respect: 10 }
      },
      {
        name: 'Уборка двора',
        description: 'Работа на свежем воздухе - уборка тюремного двора.',
        level: 2,
        energyCost: 30,
        moneyReward: 70,
        expReward: 18,
        duration: 120,
        category: 'manual',
        icon: '🌱',
        successRate: 85,
        requirements: { respect: 15 }
      },
      {
        name: 'Помощь библиотекарю',
        description: 'Сортировка книг и помощь в библиотеке.',
        level: 3,
        energyCost: 20,
        moneyReward: 80,
        expReward: 20,
        duration: 100,
        category: 'intellectual',
        icon: '📚',
        successRate: 90,
        requirements: { respect: 25 }
      },

      // Уровень 4-5 - Сложные работы
      {
        name: 'Кухонный помощник',
        description: 'Помощь повару в приготовлении еды.',
        level: 4,
        energyCost: 35,
        moneyReward: 120,
        expReward: 30,
        duration: 150,
        category: 'manual',
        icon: '👨‍🍳',
        successRate: 75,
        requirements: { respect: 50 },
        cooldown: 300 // 5 минут кулдаун
      },
      {
        name: 'Ремонт электроники',
        description: 'Починка радио, телевизоров и другой техники.',
        level: 4,
        energyCost: 30,
        moneyReward: 150,
        expReward: 35,
        duration: 180,
        category: 'intellectual',
        icon: '🔧',
        successRate: 70,
        requirements: { respect: 60 },
        cooldown: 600 // 10 минут кулдаун
      },
      {
        name: 'Охрана склада',
        description: 'Охрана тюремного склада от воровства.',
        level: 5,
        energyCost: 40,
        moneyReward: 200,
        expReward: 50,
        duration: 200,
        category: 'dangerous',
        icon: '🛡️',
        successRate: 65,
        requirements: { respect: 100 },
        cooldown: 900, // 15 минут кулдаун
        failurePenalty: {
          energyLoss: 10,
          moneyLoss: 50
        }
      },

      // Уровень 6-8 - Опасные работы
      {
        name: 'Контрабанда',
        description: 'Нелегальная доставка запрещенных предметов.',
        level: 6,
        energyCost: 50,
        moneyReward: 300,
        expReward: 60,
        duration: 240,
        category: 'illegal',
        icon: '📦',
        successRate: 60,
        requirements: { respect: 150 },
        cooldown: 1800, // 30 минут кулдаун
        failurePenalty: {
          energyLoss: 20,
          moneyLoss: 100
        }
      },
      {
        name: 'Подпольная торговля',
        description: 'Торговля запрещенными товарами между заключенными.',
        level: 7,
        energyCost: 45,
        moneyReward: 400,
        expReward: 80,
        duration: 300,
        category: 'illegal',
        icon: '💰',
        successRate: 55,
        requirements: { respect: 200 },
        cooldown: 3600, // 1 час кулдаун
        failurePenalty: {
          energyLoss: 25,
          moneyLoss: 150
        }
      },
      {
        name: 'Организация драк',
        description: 'Организация подпольных боев между заключенными.',
        level: 8,
        energyCost: 60,
        moneyReward: 500,
        expReward: 100,
        duration: 360,
        category: 'dangerous',
        icon: '👊',
        successRate: 50,
        requirements: { respect: 300 },
        cooldown: 7200, // 2 часа кулдаун
        failurePenalty: {
          energyLoss: 30,
          moneyLoss: 200
        }
      },

      // Уровень 9-10 - Легендарные работы
      {
        name: 'Тюремный король',
        description: 'Управление подпольной экономикой тюрьмы.',
        level: 9,
        energyCost: 80,
        moneyReward: 800,
        expReward: 150,
        duration: 600,
        category: 'illegal',
        icon: '👑',
        successRate: 40,
        requirements: { respect: 500 },
        cooldown: 14400, // 4 часа кулдаун
        failurePenalty: {
          energyLoss: 40,
          moneyLoss: 300
        }
      },
      {
        name: 'Побег из тюрьмы',
        description: 'Планирование и организация побега.',
        level: 10,
        energyCost: 100,
        moneyReward: 1500,
        expReward: 300,
        duration: 900,
        category: 'illegal',
        icon: '🏃‍♂️',
        successRate: 30,
        requirements: { respect: 1000 },
        cooldown: 28800, // 8 часов кулдаун
        failurePenalty: {
          energyLoss: 50,
          moneyLoss: 500
        }
      }
    ];

    await Work.insertMany(works);
    console.log(`✅ Создано ${works.length} работ`);

    const categoryStats = works.reduce((acc, work) => {
      acc[work.category] = (acc[work.category] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Статистика по категориям:');
    for (const category in categoryStats) {
      console.log(`  ${category}: ${categoryStats[category]} работ`);
    }

    const levelStats = works.reduce((acc, work) => {
      acc[work.level] = (acc[work.level] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Статистика по уровням:');
    for (const level in levelStats) {
      console.log(`  Уровень ${level}: ${levelStats[level]} работ`);
    }
  } catch (error) {
    console.error('❌ Ошибка при заполнении работ:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Отключение от MongoDB');
  }
};

seedWorks();
