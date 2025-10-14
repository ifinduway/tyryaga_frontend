import User from "../models/User.js";
import Boss from "../models/Boss.js";
import Message from "../models/Message.js";
import Clan from "../models/Clan.js";

export const setupSocketHandlers = (io) => {
  // Middleware для отслеживания подключений
  io.use(async (socket, next) => {
    try {
      // Обновляем статус пользователя как онлайн
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          online: true,
          lastSeen: new Date(),
        });
      }
      next();
    } catch (error) {
      console.error("Socket middleware error:", error);
      next(error);
    }
  });

  // Обработка подключения
  io.on("connection", async (socket) => {
    console.log(
      `Пользователь ${socket.user?.nickname} подключился (${socket.id})`
    );

    // Присоединение к глобальному чату
    socket.join("global");

    // Отправляем последние сообщения глобального чата
    try {
      const messages = await Message.getRoomMessages("global", null, 20);
      socket.emit("chatHistory", {
        room: "global",
        messages: messages.reverse(),
      });
    } catch (error) {
      console.error("Ошибка загрузки истории чата:", error);
    }

    // Обработка сообщений чата
    socket.on("chatMessage", async (data) => {
      try {
        const { room, roomId, text } = data;

        if (!text || text.trim().length === 0) {
          return socket.emit("error", {
            message: "Сообщение не может быть пустым",
          });
        }

        if (text.length > 500) {
          return socket.emit("error", { message: "Сообщение слишком длинное" });
        }

        // Создаем сообщение
        const message = new Message({
          room,
          roomId,
          senderId: socket.userId,
          text: text.trim(),
        });

        await message.save();

        // Заполняем данные отправителя
        await message.populate("senderId", "nickname");

        // Отправляем сообщение всем в комнате
        const fullRoomName = roomId ? `${room}_${roomId}` : room;
        io.to(fullRoomName).emit("newMessage", {
          id: message._id,
          room: message.room,
          roomId: message.roomId,
          senderId: message.senderId._id,
          senderName: message.senderId.nickname,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error("Ошибка отправки сообщения:", error);
        socket.emit("error", { message: "Ошибка отправки сообщения" });
      }
    });

    // Присоединение к комнате
    socket.on("joinRoom", async (data) => {
      try {
        const { room, roomId } = data;
        const fullRoomName = roomId ? `${room}_${roomId}` : room;

        // Проверяем права доступа к комнате
        if (room === "clan") {
          const user = await User.findById(socket.userId);
          if (!user.clanId || user.clanId.toString() !== roomId) {
            return socket.emit("error", {
              message: "Нет доступа к чату клана",
            });
          }
        }

        socket.join(fullRoomName);

        // Отправляем историю сообщений
        const messages = await Message.getRoomMessages(room, roomId, 20);
        socket.emit("chatHistory", {
          room,
          roomId,
          messages: messages.reverse(),
        });

        console.log(
          `Пользователь ${socket.user?.nickname} присоединился к комнате ${fullRoomName}`
        );
      } catch (error) {
        console.error("Ошибка присоединения к комнате:", error);
        socket.emit("error", { message: "Ошибка присоединения к комнате" });
      }
    });

    // Покидание комнаты
    socket.on("leaveRoom", (data) => {
      const { room, roomId } = data;
      const fullRoomName = roomId ? `${room}_${roomId}` : room;
      socket.leave(fullRoomName);
      console.log(
        `Пользователь ${socket.user?.nickname} покинул комнату ${fullRoomName}`
      );
    });

    // Присоединение к бою с боссом
    socket.on("joinBoss", async (data) => {
      try {
        const { bossId } = data;

        const boss = await Boss.findById(bossId);
        if (!boss) {
          return socket.emit("error", { message: "Босс не найден" });
        }

        if (!boss.isAvailable()) {
          return socket.emit("error", { message: "Босс недоступен для боя" });
        }

        const roomName = `boss_${bossId}`;
        socket.join(roomName);

        // Отправляем текущее состояние босса
        socket.emit("bossState", {
          bossId: boss._id,
          name: boss.name,
          maxHp: boss.maxHp,
          currentHp: boss.currentHp,
          level: boss.level,
          state: boss.state,
          participants: boss.participants.length,
        });

        // Уведомляем других участников
        socket.to(roomName).emit("playerJoined", {
          userId: socket.userId,
          nickname: socket.user.nickname,
          level: socket.user.level,
        });

        console.log(
          `Пользователь ${socket.user?.nickname} присоединился к бою с боссом ${boss.name}`
        );
      } catch (error) {
        console.error("Ошибка присоединения к бою:", error);
        socket.emit("error", { message: "Ошибка присоединения к бою" });
      }
    });

    // Нанесение урона боссу
    socket.on("dealDamage", async (data) => {
      try {
        const { bossId, damage } = data;

        if (!damage || damage <= 0) {
          return socket.emit("error", { message: "Неверный урон" });
        }

        const user = await User.findById(socket.userId);
        if (!user.hasEnergy(1)) {
          return socket.emit("error", { message: "Недостаточно энергии" });
        }

        const boss = await Boss.findById(bossId);
        if (!boss || !boss.isAvailable()) {
          return socket.emit("error", { message: "Босс недоступен" });
        }

        // Тратим энергию
        user.spendEnergy(1);
        await user.save();

        // Рассчитываем реальный урон (можно добавить формулы на основе оружия, уровня и т.д.)
        const realDamage = Math.min(damage, user.level * 10); // Простая формула

        // Наносим урон боссу
        const damageDealt = boss.takeDamage(realDamage, socket.userId);

        if (damageDealt) {
          await boss.save();

          const roomName = `boss_${bossId}`;

          // Отправляем обновление всем участникам
          io.to(roomName).emit("bossUpdate", {
            bossId: boss._id,
            currentHp: boss.currentHp,
            maxHp: boss.maxHp,
            damageDealt: realDamage,
            dealtBy: {
              userId: socket.userId,
              nickname: socket.user.nickname,
            },
            participants: boss.participants.length,
          });

          // Если босс убит
          if (boss.state === "dead") {
            const rewards = await distributeRewards(boss);

            io.to(roomName).emit("bossDefeated", {
              bossId: boss._id,
              bossName: boss.name,
              rewards: rewards,
              participants: boss.participants.map((p) => ({
                userId: p.userId,
                damageDealt: p.damageDealt,
              })),
            });

            // Создаем системное сообщение
            await Message.createSystemMessage(
              "global",
              null,
              `Босс ${boss.name} был побежден! Участники получили награды.`
            );

            // Уведомляем всех в глобальном чате
            io.to("global").emit("bossDefeatedGlobal", {
              bossName: boss.name,
              participantCount: boss.participants.length,
            });
          }
        }
      } catch (error) {
        console.error("Ошибка нанесения урона:", error);
        socket.emit("error", { message: "Ошибка нанесения урона" });
      }
    });

    // Обработка отключения
    socket.on("disconnect", async () => {
      try {
        console.log(
          `Пользователь ${socket.user?.nickname} отключился (${socket.id})`
        );

        // Обновляем статус пользователя как оффлайн
        if (socket.userId) {
          await User.findByIdAndUpdate(socket.userId, {
            online: false,
            lastSeen: new Date(),
          });
        }
      } catch (error) {
        console.error("Ошибка при отключении пользователя:", error);
      }
    });
  });

  // Функция распределения наград
  const distributeRewards = async (boss) => {
    try {
      const totalDamage = boss.participants.reduce(
        (sum, p) => sum + p.damageDealt,
        0
      );
      const rewards = [];

      for (const participant of boss.participants) {
        const damagePercentage = participant.damageDealt / totalDamage;
        const userRewards = boss.calculateRewards(participant.userId);

        if (userRewards) {
          const user = await User.findById(participant.userId);
          if (user) {
            user.money += userRewards.money;
            user.exp += userRewards.exp;

            // Проверяем повышение уровня
            const expToNextLevel = user.level * 1000;
            if (user.exp >= expToNextLevel) {
              user.level += 1;
              user.exp -= expToNextLevel;
            }

            await user.save();

            rewards.push({
              userId: participant.userId,
              nickname: user.nickname,
              money: userRewards.money,
              exp: userRewards.exp,
              items: userRewards.items,
              damagePercentage: (damagePercentage * 100).toFixed(2),
            });
          }
        }
      }

      return rewards;
    } catch (error) {
      console.error("Ошибка распределения наград:", error);
      return [];
    }
  };
};
