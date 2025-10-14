import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['weapon', 'armor', 'consumable', 'misc']
    },
    rarity: {
      type: String,
      required: true,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary']
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    stats: {
      damage: { type: Number, default: 0 },
      defense: { type: Number, default: 0 },
      energy: { type: Number, default: 0 },
      health: { type: Number, default: 0 },
      luck: { type: Number, default: 0 }
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    sellPrice: {
      type: Number,
      required: true,
      min: 0
    },
    stackable: {
      type: Boolean,
      default: false
    },
    maxStack: {
      type: Number,
      default: 1
    },
    consumable: {
      type: Boolean,
      default: false
    },
    effects: [
      {
        type: {
          type: String,
          enum: [
            'damage_boost',
            'defense_boost',
            'energy_restore',
            'health_restore',
            'luck_boost'
          ]
        },
        value: Number,
        duration: Number // в минутах, 0 = постоянный эффект
      }
    ],
    icon: {
      type: String,
      default: '📦'
    }
  },
  {
    timestamps: true
  }
);

// Виртуальное поле для цвета редкости
itemSchema.virtual('rarityColor').get(function () {
  const colors = {
    common: '#9CA3AF', // серый
    uncommon: '#10B981', // зеленый
    rare: '#3B82F6', // синий
    epic: '#8B5CF6', // фиолетовый
    legendary: '#F59E0B' // золотой
  };
  return colors[this.rarity] || '#9CA3AF';
});

// Метод для получения бонуса к урону
itemSchema.methods.getDamageBonus = function () {
  return this.stats.damage || 0;
};

// Метод для получения бонуса к защите
itemSchema.methods.getDefenseBonus = function () {
  return this.stats.defense || 0;
};

// Метод для проверки, можно ли использовать предмет
itemSchema.methods.canUse = function (userLevel) {
  return userLevel >= this.level;
};

export default mongoose.model('Item', itemSchema);
