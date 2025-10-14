import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      enum: ["global", "clan", "boss"],
    },
    roomId: {
      type: String,
      default: null, // clan_<id> или boss_<id>
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    messageType: {
      type: String,
      enum: ["text", "system", "boss_update", "boss_defeated"],
      default: "text",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Индексы для оптимизации
messageSchema.index({ room: 1, roomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ createdAt: -1 });

// Виртуальное поле для полного имени комнаты
messageSchema.virtual("fullRoomName").get(function () {
  if (this.roomId) {
    return `${this.room}_${this.roomId}`;
  }
  return this.room;
});

// Статический метод для получения сообщений комнаты
messageSchema.statics.getRoomMessages = function (
  room,
  roomId = null,
  limit = 50
) {
  const query = { room };
  if (roomId) {
    query.roomId = roomId;
  }

  return this.find(query)
    .populate("senderId", "nickname")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Статический метод для создания системного сообщения
messageSchema.statics.createSystemMessage = function (
  room,
  roomId,
  text,
  metadata = {}
) {
  return this.create({
    room,
    roomId,
    senderId: null, // Системное сообщение
    text,
    messageType: "system",
    metadata,
  });
};

export default mongoose.model("Message", messageSchema);
