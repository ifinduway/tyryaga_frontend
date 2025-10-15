import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Boss from '../models/Boss.js';
import BossTemplate from '../models/BossTemplate.js';
import BossInstance from '../models/BossInstance.js';
import User from '../models/User.js';

dotenv.config();

const migrateBossSystem = async () => {
  try {
    console.log('🔄 Начинаем миграцию системы боссов...\n');

    // Подключаемся к БД
    const mongoURI =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';
    await mongoose.connect(mongoURI);
    console.log('✅ Подключение к MongoDB установлено\n');

    // Шаг 1: Получаем все текущие боссы
    console.log('📋 Шаг 1: Получение существующих боссов...');
    const existingBosses = await Boss.find();
    console.log(`   Найдено боссов: ${existingBosses.length}\n`);

    // Шаг 2: Создаем шаблоны из существующих боссов
    console.log('📋 Шаг 2: Создание шаблонов боссов...');
    const templateMap = new Map(); // Мапа для сопоставления старых ID с новыми

    for (const boss of existingBosses) {
      // Определяем требуемый уровень на основе уровня босса
      const requiredLevel = Math.max(1, Math.floor(boss.level * 0.8));

      const template = new BossTemplate({
        name: boss.name,
        description: `${boss.name} - опасный противник`,
        maxHp: boss.maxHp,
        level: boss.level,
        requiredLevel: requiredLevel,
        rewards: boss.rewards,
        instanceDuration: 30 * 60 * 1000, // 30 минут
        isActive: true,
        stats: {
          totalKills: 0,
          totalAttempts: 0,
          averageKillTime: 0,
          fastestKillTime: 0,
          fastestKillBy: null
        }
      });

      await template.save();
      templateMap.set(boss._id.toString(), template._id);
      console.log(
        `   ✅ Создан шаблон: ${template.name} (уровень ${template.level}, требуется ${template.requiredLevel})`
      );
    }

    console.log(
      `\n   Создано шаблонов: ${templateMap.size}/${existingBosses.length}\n`
    );

    // Шаг 3: Очищаем поле currentBossId у пользователей и преобразуем bossKills в bossStats
    console.log('📋 Шаг 3: Обновление пользователей...');
    const users = await User.find({
      $or: [{ currentBossId: { $exists: true } }, { bossKills: { $exists: true } }]
    });
    console.log(`   Найдено пользователей для обновления: ${users.length}`);

    let updatedUsers = 0;
    for (const user of users) {
      const updates = {};

      // Удаляем старое поле currentBossId
      if (user.currentBossId) {
        updates.$unset = { currentBossId: 1 };
      }

      // Преобразуем bossKills в bossStats если есть
      if (user.bossKills && user.bossKills.size > 0) {
        const bossStats = new Map();
        
        for (const [oldBossId, kills] of user.bossKills) {
          const newTemplateId = templateMap.get(oldBossId);
          if (newTemplateId) {
            bossStats.set(newTemplateId.toString(), {
              kills: kills,
              attempts: kills, // Предполагаем, что попыток было столько же
              bestTime: 0,
              lastKilledAt: null
            });
          }
        }

        if (bossStats.size > 0) {
          updates.bossStats = bossStats;
        }
        
        // Удаляем старое поле
        if (!updates.$unset) {
          updates.$unset = {};
        }
        updates.$unset.bossKills = 1;
      }

      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, updates);
        updatedUsers++;
      }
    }

    console.log(`   ✅ Обновлено пользователей: ${updatedUsers}\n`);

    // Шаг 4: Удаляем все активные инстансы боссов (если они есть)
    console.log('📋 Шаг 4: Очистка активных инстансов...');
    const deletedInstances = await BossInstance.deleteMany({});
    console.log(`   ✅ Удалено инстансов: ${deletedInstances.deletedCount}\n`);

    // Шаг 5: Удаляем старые боссы
    console.log('📋 Шаг 5: Удаление старых боссов...');
    const deletedBosses = await Boss.deleteMany({});
    console.log(`   ✅ Удалено боссов: ${deletedBosses.deletedCount}\n`);

    // Итоговая статистика
    console.log('✅ Миграция завершена успешно!\n');
    console.log('📊 Итоговая статистика:');
    console.log(`   - Создано шаблонов боссов: ${templateMap.size}`);
    console.log(`   - Обновлено пользователей: ${updatedUsers}`);
    console.log(`   - Удалено старых боссов: ${deletedBosses.deletedCount}`);
    console.log(`   - Удалено инстансов: ${deletedInstances.deletedCount}\n`);

    console.log('📋 Созданные шаблоны боссов:');
    const templates = await BossTemplate.find().sort({ requiredLevel: 1 });
    for (const template of templates) {
      console.log(
        `   - ${template.name}: уровень ${template.level}, требуется ${template.requiredLevel}, награда ${template.rewards.money}💰 ${template.rewards.exp}⭐`
      );
    }

    console.log('\n✨ Миграция завершена! Теперь можно запускать сервер с новой системой боссов.\n');
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Соединение с MongoDB закрыто');
    process.exit(0);
  }
};

// Запускаем миграцию
migrateBossSystem();

