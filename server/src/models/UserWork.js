import mongoose from 'mongoose';

const UserWorkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Work',
      required: true
    },
    status: {
      type: String,
      enum: ['working', 'completed', 'failed', 'cancelled'],
      default: 'working'
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    duration: { type: Number }, // фактическая длительность в секундах
    rewards: {
      money: { type: Number, default: 0 },
      exp: { type: Number, default: 0 }
    },
    penalties: {
      energyLoss: { type: Number, default: 0 },
      moneyLoss: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// Индексы
UserWorkSchema.index({ userId: 1, status: 1 });
UserWorkSchema.index({ workId: 1 });
UserWorkSchema.index({ startedAt: 1 });

const UserWork = mongoose.model('UserWork', UserWorkSchema);
export default UserWork;
