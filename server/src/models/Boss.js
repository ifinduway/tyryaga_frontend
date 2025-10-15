import mongoose from 'mongoose';

const bossSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    maxHp: {
      type: Number,
      required: true,
      min: 1
    },
    currentHp: {
      type: Number,
      required: true,
      min: 0
    },
    level: {
      type: Number,
      required: true,
      min: 1
    },
    rewards: {
      money: {
        type: Number,
        default: 0,
        min: 0
      },
      exp: {
        type: Number,
        default: 0,
        min: 0
      },
      items: [
        {
          itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item'
          },
          dropRate: {
            type: Number,
            default: 0.1,
            min: 0,
            max: 1
          }
        }
      ]
    },
    spawnAt: {
      type: Date,
      default: null
    },
    state: {
      type: String,
      enum: ['available', 'in_battle', 'dead'],
      default: 'available'
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        damageDealt: {
          type: Number,
          default: 0
        },
        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    defeatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Индексы
bossSchema.index({ spawnAt: 1 });

// Метод для проверки доступности босса
bossSchema.methods.isAvailable = function () {
  return this.currentHp > 0;
};

// Метод для получения урона
bossSchema.methods.takeDamage = function (damage, userId) {
  if (!this.isAvailable()) return false;

  // Переводим босса в состояние "в бою" при первом уроне
  if (this.state === 'available') {
    this.state = 'in_battle';
  }

  this.currentHp = Math.max(0, this.currentHp - damage);

  // Обновляем статистику участника
  const participant = this.participants.find(
    p => p.userId.toString() === userId.toString()
  );
  if (participant) {
    participant.damageDealt += damage;
  } else {
    this.participants.push({
      userId,
      damageDealt: damage
    });
  }

  return true;
};

export default mongoose.model('Boss', bossSchema);
