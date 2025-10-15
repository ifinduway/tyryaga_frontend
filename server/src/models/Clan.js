import mongoose from 'mongoose';

const clanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        role: {
          type: String,
          enum: ['leader', 'officer', 'member'],
          default: 'member'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        contribution: {
          type: Number,
          default: 0,
          min: 0
        }
      }
    ],
    bank: {
      type: Number,
      default: 0,
      min: 0
    },
    description: {
      type: String,
      maxlength: 200,
      default: ''
    },
    maxMembers: {
      type: Number,
      default: 20,
      min: 5,
      max: 50
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    exp: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Индексы (name уже имеет unique: true, поэтому явный индекс не нужен)
clanSchema.index({ leaderId: 1 });
clanSchema.index({ 'members.userId': 1 });

// Виртуальное поле для количества участников
clanSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Метод для проверки, является ли пользователь участником
clanSchema.methods.isMember = function (userId) {
  return this.members.some(
    member => member.userId.toString() === userId.toString()
  );
};

// Метод для проверки роли пользователя
clanSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find(
    member => member.userId.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// Метод для добавления участника
clanSchema.methods.addMember = function (userId, role = 'member') {
  if (this.memberCount >= this.maxMembers) {
    throw new Error('Клан переполнен');
  }

  if (this.isMember(userId)) {
    throw new Error('Пользователь уже в клане');
  }

  this.members.push({
    userId,
    role,
    joinedAt: new Date()
  });
};

// Метод для удаления участника
clanSchema.methods.removeMember = function (userId) {
  const memberIndex = this.members.findIndex(
    member => member.userId.toString() === userId.toString()
  );
  if (memberIndex === -1) {
    throw new Error('Пользователь не найден в клане');
  }

  this.members.splice(memberIndex, 1);
};

// Метод для изменения роли участника
clanSchema.methods.changeMemberRole = function (userId, newRole) {
  const member = this.members.find(
    member => member.userId.toString() === userId.toString()
  );
  if (!member) {
    throw new Error('Пользователь не найден в клане');
  }

  member.role = newRole;
};

// Метод для пополнения банка
clanSchema.methods.deposit = function (amount) {
  this.bank += amount;
};

// Метод для снятия с банка
clanSchema.methods.withdraw = function (amount) {
  if (this.bank < amount) {
    throw new Error('Недостаточно средств в банке');
  }
  this.bank -= amount;
};

export default mongoose.model('Clan', clanSchema);
