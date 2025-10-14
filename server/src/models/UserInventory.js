import mongoose from 'mongoose';

const userInventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1
        },
        equipped: {
          type: Boolean,
          default: false
        },
        slot: {
          type: String,
          enum: [
            'weapon',
            'armor',
            'consumable1',
            'consumable2',
            'consumable3',
            'consumable4',
            'consumable5'
          ],
          default: null
        }
      }
    ],
    maxSlots: {
      type: Number,
      default: 20
    }
  },
  {
    timestamps: true
  }
);

// Индекс для быстрого поиска по пользователю
userInventorySchema.index({ userId: 1 });

// Метод для добавления предмета в инвентарь
userInventorySchema.methods.addItem = function (itemId, quantity = 1) {
  const existingItem = this.items.find(
    item => item.itemId.toString() === itemId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      itemId,
      quantity
    });
  }

  return this.save();
};

// Метод для удаления предмета из инвентаря
userInventorySchema.methods.removeItem = function (itemId, quantity = 1) {
  const itemIndex = this.items.findIndex(
    item => item.itemId.toString() === itemId.toString()
  );

  if (itemIndex !== -1) {
    const item = this.items[itemIndex];
    if (item.quantity <= quantity) {
      this.items.splice(itemIndex, 1);
    } else {
      item.quantity -= quantity;
    }
  }

  return this.save();
};

// Метод для экипировки предмета
userInventorySchema.methods.equipItem = function (itemId, slot) {
  const item = this.items.find(
    item => item.itemId.toString() === itemId.toString()
  );

  if (item) {
    // Снимаем предмет с текущего слота
    this.items.forEach(i => {
      if (i.slot === slot) {
        i.equipped = false;
        i.slot = null;
      }
    });

    // Экипируем новый предмет
    item.equipped = true;
    item.slot = slot;
  }

  return this.save();
};

// Метод для снятия предмета
userInventorySchema.methods.unequipItem = function (itemId) {
  const item = this.items.find(
    item => item.itemId.toString() === itemId.toString()
  );

  if (item) {
    item.equipped = false;
    item.slot = null;
  }

  return this.save();
};

// Метод для получения экипированных предметов
userInventorySchema.methods.getEquippedItems = function () {
  return this.items.filter(item => item.equipped);
};

// Метод для получения предметов по типу
userInventorySchema.methods.getItemsByType = function (type) {
  return this.items.filter(item => item.itemId.type === type);
};

export default mongoose.model('UserInventory', userInventorySchema);
