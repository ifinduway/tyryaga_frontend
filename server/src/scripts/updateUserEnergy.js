import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: '../../.env' });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';

const updateUserEnergy = async (nickname, energy) => {
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

    user.energy = energy;
    await user.save();

    console.log(`✅ Энергия обновлена: ${user.energy}`);
  } catch (error) {
    console.error('❌ Ошибка при обновлении энергии:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Отключение от MongoDB');
  }
};

// Получаем аргументы из командной строки
const nickname = process.argv[2] || 'fuway';
const energy = parseInt(process.argv[3]) || 100000;

updateUserEnergy(nickname, energy);
