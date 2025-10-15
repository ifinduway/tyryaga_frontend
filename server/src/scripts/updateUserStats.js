import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  try {
    const [nickname, dmgMultArg, critMultArg, critChanceArg] =
      process.argv.slice(2);

    if (!nickname) {
      console.error(
        'Usage: node src/scripts/updateUserStats.js <nickname> [damageMultiplier] [critDamageMultiplier] [critChance]'
      );
      process.exit(1);
    }

    const mongoURI =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';
    await mongoose.connect(mongoURI);

    const user = await User.findOne({ nickname });
    if (!user) {
      console.error(`User with nickname "${nickname}" not found`);
      process.exit(1);
    }

    if (dmgMultArg !== undefined) {
      const val = Number(dmgMultArg);
      if (!Number.isFinite(val) || val < 0.1)
        throw new Error('Invalid damageMultiplier');
      user.damageMultiplier = val;
    }

    if (critMultArg !== undefined) {
      const val = Number(critMultArg);
      if (!Number.isFinite(val) || val < 1)
        throw new Error('Invalid critDamageMultiplier');
      user.critDamageMultiplier = val;
    }

    if (critChanceArg !== undefined) {
      const val = Number(critChanceArg);
      if (!Number.isFinite(val) || val < 0 || val > 100)
        throw new Error('Invalid critChance');
      user.critChance = val;
    }

    await user.save();

    console.log('Updated user stats:', {
      nickname: user.nickname,
      damageMultiplier: user.damageMultiplier,
      critDamageMultiplier: user.critDamageMultiplier,
      critChance: user.critChance
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error updating user stats:', err.message || err);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

run();
