import mongoose from 'mongoose';

const bossTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    maxHp: {
      type: Number,
      required: true,
      min: 1
    },
    level: {
      type: Number,
      required: true,
      min: 1
    },
    requiredLevel: {
      type: Number,
      required: true,
      min: 1,
      default: 1
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
    instanceDuration: {
      type: Number, // в миллисекундах
      default: 30 * 60 * 1000, // 30 минут по умолчанию
      min: 60000 // минимум 1 минута
    },
    // Глобальная статистика
    stats: {
      totalKills: {
        type: Number,
        default: 0,
        min: 0
      },
      totalAttempts: {
        type: Number,
        default: 0,
        min: 0
      },
      averageKillTime: {
        type: Number, // в миллисекундах
        default: 0,
        min: 0
      },
      fastestKillTime: {
        type: Number, // в миллисекундах
        default: 0,
        min: 0
      },
      fastestKillBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Индексы
bossTemplateSchema.index({ level: 1 });
bossTemplateSchema.index({ requiredLevel: 1 });
bossTemplateSchema.index({ isActive: 1 });

// Виртуальное поле для получения активных инстансов
bossTemplateSchema.virtual('activeInstances', {
  ref: 'BossInstance',
  localField: '_id',
  foreignField: 'templateId',
  match: { isCompleted: false, expiresAt: { $gt: new Date() } }
});

export default mongoose.model('BossTemplate', bossTemplateSchema);
