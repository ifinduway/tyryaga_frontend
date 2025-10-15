import mongoose from 'mongoose';

const bossInstanceSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BossTemplate',
      required: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    currentHp: {
      type: Number,
      required: true,
      min: 0
    },
    maxHp: {
      type: Number,
      required: true,
      min: 1
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        damageDealt: {
          type: Number,
          default: 0,
          min: 0
        },
        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true
    },
    // Время боя (для статистики)
    battleDuration: {
      type: Number, // в миллисекундах
      default: 0,
      min: 0
    },
    // Флаг для отслеживания награждения
    rewardsDistributed: {
      type: Boolean,
      default: false
    },
    // Приватность инстанса
    isPrivate: {
      type: Boolean,
      default: false
    },
    // Список приглашенных игроков (для приватных инстансов)
    invitedPlayers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        invitedAt: {
          type: Date,
          default: Date.now
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined'],
          default: 'pending'
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Индексы
bossInstanceSchema.index({ ownerId: 1 });
bossInstanceSchema.index({ templateId: 1 });
bossInstanceSchema.index({ expiresAt: 1 });
bossInstanceSchema.index({ isCompleted: 1 });
bossInstanceSchema.index({ ownerId: 1, isCompleted: 1 }); // для быстрого поиска активного инстанса игрока

// Метод для проверки доступности инстанса
bossInstanceSchema.methods.isAvailable = function () {
  return this.currentHp > 0 && !this.isCompleted && new Date() < this.expiresAt;
};

// Метод для проверки истечения времени
bossInstanceSchema.methods.isExpired = function () {
  return new Date() >= this.expiresAt;
};

// Метод для получения урона
bossInstanceSchema.methods.takeDamage = function (damage, userId) {
  if (!this.isAvailable()) return false;

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
      damageDealt: damage,
      joinedAt: new Date()
    });
  }

  // Если босс убит, отмечаем как завершенный
  if (this.currentHp === 0) {
    this.isCompleted = true;
    this.completedAt = new Date();
    this.battleDuration = this.completedAt - this.createdAt;
  }

  return true;
};

// Метод для добавления участника
bossInstanceSchema.methods.addParticipant = function (userId) {
  const participant = this.participants.find(
    p => p.userId.toString() === userId.toString()
  );

  if (!participant) {
    this.participants.push({
      userId,
      damageDealt: 0,
      joinedAt: new Date()
    });
    return true;
  }

  return false;
};

// Метод для приглашения игрока (для приватных инстансов)
bossInstanceSchema.methods.invitePlayer = function (userId) {
  // Проверяем, не приглашен ли уже
  const invited = this.invitedPlayers.find(
    p => p.userId.toString() === userId.toString()
  );

  if (invited) {
    return false;
  }

  this.invitedPlayers.push({
    userId,
    invitedAt: new Date(),
    status: 'pending'
  });

  return true;
};

// Метод для проверки доступа к приватному инстансу
bossInstanceSchema.methods.hasAccess = function (userId) {
  // Владелец всегда имеет доступ
  if (this.ownerId.toString() === userId.toString()) {
    return true;
  }

  // Если инстанс публичный, доступ есть у всех
  if (!this.isPrivate) {
    return true;
  }

  // Для приватных инстансов проверяем приглашение
  const invitation = this.invitedPlayers.find(
    p => p.userId.toString() === userId.toString()
  );

  return !!invitation;
};

export default mongoose.model('BossInstance', bossInstanceSchema);
