import mongoose from 'mongoose';

const WorkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    level: { type: Number, required: true, min: 1 },
    energyCost: { type: Number, required: true, min: 1 },
    moneyReward: { type: Number, required: true, min: 1 },
    expReward: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 }, // в секундах
    category: {
      type: String,
      enum: ['manual', 'intellectual', 'dangerous', 'illegal'],
      required: true
    },
    icon: { type: String, default: '💼' },
    requirements: {
      respect: { type: Number, default: 0 },
      items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
    },
    cooldown: { type: Number, default: 0 }, // кулдаун в секундах
    successRate: { type: Number, default: 100, min: 0, max: 100 }, // процент успеха
    failurePenalty: {
      energyLoss: { type: Number, default: 0 },
      moneyLoss: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// Индексы
WorkSchema.index({ level: 1 });
WorkSchema.index({ category: 1 });
WorkSchema.index({ energyCost: 1 });

const Work = mongoose.model('Work', WorkSchema);
export default Work;
