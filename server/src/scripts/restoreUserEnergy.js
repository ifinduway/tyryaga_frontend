import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: '../../.env' });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const restoreUserEnergy = async nickname => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено');

    const user = await User.findOne({ nickname });

    if (!user) {
      console.log(`❌ Пользователь с nickname "${nickname}" не найден`);
      return;
    }

    console.log(`👤 Найден пользователь: ${user.nickname}`);
    console.log(`⚡ Текущая энергия: ${user.energy}`);

    // Восстанавливаем энергию до максимума (100,000)
    const maxEnergy = 100000;
    user.energy = maxEnergy;
    user.energyLastUpdate = new Date();
    await user.save();

    console.log(`✅ Энергия восстановлена до: ${user.energy}`);
    console.log(`🕐 Время последнего обновления: ${user.energyLastUpdate}`);
  } catch (error) {
    console.error('❌ Ошибка при восстановлении энергии:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Отключение от MongoDB');
  }
};

// Получаем аргументы из командной строки
const nickname = process.argv[2] || 'fuway';

console.log(`🔄 Восстановление энергии для пользователя: ${nickname}...`);
restoreUserEnergy(nickname);
