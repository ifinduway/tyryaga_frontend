import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    nickname: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 100
    },
    exp: {
      type: Number,
      default: 0,
      min: 0
    },
    money: {
      type: Number,
      default: 1000,
      min: 0
    },
    respect: {
      type: Number,
      default: 0,
      min: 0
    },
    // Боевые характеристики
    damageMultiplier: {
      type: Number,
      default: 100,
      min: 0.1,
      max: 100
    },
    critDamageMultiplier: {
      type: Number,
      default: 2,
      min: 1,
      max: 100
    },
    critChance: {
      type: Number, // процент, 0..100
      default: 100,
      min: 0,
      max: 100
    },
    energy: {
      type: Number,
      default: 100,
      min: 0,
      max: 1000000
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item'
        },
        qty: {
          type: Number,
          default: 1,
          min: 1
        }
      }
    ],
    clanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clan',
      default: null
    },
    online: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    energyLastUpdate: {
      type: Date,
      default: Date.now
    },
    // Статистика по боссам
    bossStats: {
      type: Map,
      of: {
        kills: { type: Number, default: 0 },
        attempts: { type: Number, default: 0 },
        bestTime: { type: Number, default: 0 }, // в миллисекундах
        lastKilledAt: { type: Date, default: null }
      },
      default: new Map()
    },
    // Активный инстанс босса
    activeBossInstance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BossInstance',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Индексы для оптимизации (email и nickname уже имеют unique: true, поэтому явные индексы не нужны)
userSchema.index({ clanId: 1 });
userSchema.index({ online: 1 });

// Виртуальное поле для следующего уровня
userSchema.virtual('expToNextLevel').get(function () {
  return this.level * 1000 - this.exp;
});

// Метод для проверки энергии
userSchema.methods.hasEnergy = function (amount = 1) {
  return this.energy >= amount;
};

// Метод для траты энергии
userSchema.methods.spendEnergy = function (amount = 1) {
  if (this.hasEnergy(amount)) {
    this.energy -= amount;
    return true;
  }
  return false;
};

// Метод для восстановления энергии
userSchema.methods.restoreEnergy = function () {
  const now = new Date();
  const timeDiff = now - this.energyLastUpdate;
  const energyToRestore = Math.floor(timeDiff / (5 * 60 * 1000)); // +1 каждые 5 минут

  if (energyToRestore > 0) {
    this.energy = Math.min(100, this.energy + energyToRestore);
    this.energyLastUpdate = now;
  }
};

export default mongoose.model('User', userSchema);
