import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Boss from '../models/Boss.js';
import User from '../models/User.js';

dotenv.config({ path: '../../.env' });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const testBossRewards = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено\n');

    // Находим первого босса
    const boss = await Boss.findOne({ name: 'Тюремный Босс' });
    if (!boss) {
      console.log('❌ Босс "Тюремный Босс" не найден');
      return;
    }

    console.log('👹 Информация о боссе:');
    console.log(`   Имя: ${boss.name}`);
    console.log(`   HP: ${boss.currentHp}/${boss.maxHp}`);
    console.log(`   Уровень: ${boss.level}`);
    console.log(`   Состояние: ${boss.state}`);
    console.log(`\n💰 Награды за босса:`);
    console.log(`   Деньги: ${boss.rewards.money.toLocaleString('ru-RU')}`);
    console.log(`   Опыт: ${boss.rewards.exp.toLocaleString('ru-RU')}`);

    // Проверяем участников
    if (boss.participants.length === 0) {
      console.log('\n⚠️  У босса нет участников');
      console.log('   Атакуйте босса в игре, чтобы проверить распределение наград');
      return;
    }

    console.log(`\n👥 Участники (${boss.participants.length}):`);

    const totalDamage = boss.participants.reduce(
      (sum, p) => sum + p.damageDealt,
      0
    );

    for (const participant of boss.participants) {
      const user = await User.findById(participant.userId);
      const damagePercentage = (participant.damageDealt / totalDamage) * 100;

      console.log(`\n   👤 ${user?.nickname || 'Unknown'}`);
      console.log(`      Урон: ${participant.damageDealt.toLocaleString('ru-RU')}`);
      console.log(`      Доля урона: ${damagePercentage.toFixed(2)}%`);

      // Рассчитываем награды
      const rewards = boss.calculateRewards(participant.userId);
      if (rewards) {
        console.log(`      Получит:`);
        console.log(
          `        💰 ${rewards.money.toLocaleString('ru-RU')} денег`
        );
        console.log(`        ✨ ${rewards.exp.toLocaleString('ru-RU')} опыта`);
      }
    }

    // Проверяем, убит ли босс
    if (boss.state === 'dead') {
      console.log('\n💀 Босс убит!');
      console.log(`   Время победы: ${boss.defeatedAt}`);
      console.log('\n✅ Награды уже должны быть распределены');
    } else {
      console.log(`\n⚔️  Босс все еще жив (${boss.currentHp} HP)`);
      console.log('   Награды будут распределены после победы');
    }

    // Проверяем текущий баланс участников
    console.log('\n💵 Текущий баланс участников:');
    for (const participant of boss.participants) {
      const user = await User.findById(participant.userId);
      if (user) {
        console.log(`   ${user.nickname}:`);
        console.log(`     💰 Деньги: ${user.money.toLocaleString('ru-RU')}`);
        console.log(`     ✨ Опыт: ${user.exp.toLocaleString('ru-RU')}`);
        console.log(`     🎯 Уровень: ${user.level}`);
      }
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке наград:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Отключение от MongoDB');
  }
};

testBossRewards();

