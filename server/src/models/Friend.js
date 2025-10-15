import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Индексы
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });
friendSchema.index({ userId: 1, status: 1 });
friendSchema.index({ friendId: 1, status: 1 });

// Метод для проверки существования дружбы
friendSchema.statics.areFriends = async function (userId1, userId2) {
  const friendship = await this.findOne({
    $or: [
      { userId: userId1, friendId: userId2, status: 'accepted' },
      { userId: userId2, friendId: userId1, status: 'accepted' }
    ]
  });
  return !!friendship;
};

// Метод для получения списка друзей
friendSchema.statics.getFriends = async function (userId) {
  const friendships = await this.find({
    $or: [
      { userId: userId, status: 'accepted' },
      { friendId: userId, status: 'accepted' }
    ]
  })
    .populate('userId', 'nickname level')
    .populate('friendId', 'nickname level');

  // Возвращаем массив друзей (не текущего пользователя)
  return friendships.map(f => {
    const friend =
      f.userId._id.toString() === userId.toString() ? f.friendId : f.userId;
    return {
      friendshipId: f._id,
      userId: friend._id,
      nickname: friend.nickname,
      level: friend.level,
      acceptedAt: f.acceptedAt
    };
  });
};

export default mongoose.model('Friend', friendSchema);
