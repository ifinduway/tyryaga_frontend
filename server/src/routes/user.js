import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Получение профиля пользователя
router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("clanId", "name level")
      .select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "Пользователь не найден",
      });
    }

    // Восстанавливаем энергию
    user.restoreEnergy();
    await user.save();

    res.json({
      ok: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          nickname: user.nickname,
          level: user.level,
          exp: user.exp,
          expToNextLevel: user.expToNextLevel,
          money: user.money,
          respect: user.respect,
          energy: user.energy,
          items: user.items,
          clanId: user.clanId,
          online: user.online,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Ошибка получения профиля:", error);
    res.status(500).json({
      ok: false,
      error: "Ошибка получения данных пользователя",
    });
  }
});

// Обновление профиля
router.put("/me", async (req, res) => {
  try {
    const { nickname } = req.body;
    const userId = req.user._id;

    if (!nickname) {
      return res.status(400).json({
        ok: false,
        error: "Никнейм обязателен",
      });
    }

    if (nickname.length < 3 || nickname.length > 20) {
      return res.status(400).json({
        ok: false,
        error: "Никнейм должен содержать от 3 до 20 символов",
      });
    }

    // Проверяем, не занят ли никнейм
    const existingUser = await User.findOne({
      nickname,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res.status(400).json({
        ok: false,
        error: "Пользователь с таким никнеймом уже существует",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { nickname },
      { new: true }
    ).select("-passwordHash");

    res.json({
      ok: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          nickname: user.nickname,
          level: user.level,
          exp: user.exp,
          money: user.money,
          respect: user.respect,
          energy: user.energy,
          clanId: user.clanId,
        },
      },
    });
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    res.status(500).json({
      ok: false,
      error: "Ошибка обновления профиля",
    });
  }
});

// Получение списка пользователей (для лидерборда)
router.get("/leaderboard", async (req, res) => {
  try {
    const { type = "respect", limit = 50 } = req.query;

    const validTypes = ["respect", "level", "money"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        ok: false,
        error: "Неверный тип лидерборда",
      });
    }

    const users = await User.find({ online: true })
      .select("nickname level respect money")
      .sort({ [type]: -1 })
      .limit(parseInt(limit));

    res.json({
      ok: true,
      data: {
        leaderboard: users.map((user, index) => ({
          rank: index + 1,
          nickname: user.nickname,
          level: user.level,
          respect: user.respect,
          money: user.money,
        })),
      },
    });
  } catch (error) {
    console.error("Ошибка получения лидерборда:", error);
    res.status(500).json({
      ok: false,
      error: "Ошибка получения лидерборда",
    });
  }
});

// Получение статистики пользователя
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user._id;

    // Здесь можно добавить дополнительную статистику
    // Пока возвращаем базовую информацию
    const user = await User.findById(userId).select(
      "nickname level exp money respect energy online lastSeen createdAt"
    );

    res.json({
      ok: true,
      data: {
        stats: {
          nickname: user.nickname,
          level: user.level,
          exp: user.exp,
          money: user.money,
          respect: user.respect,
          energy: user.energy,
          online: user.online,
          lastSeen: user.lastSeen,
          daysPlayed: Math.floor(
            (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
          ),
        },
      },
    });
  } catch (error) {
    console.error("Ошибка получения статистики:", error);
    res.status(500).json({
      ok: false,
      error: "Ошибка получения статистики",
    });
  }
});

export default router;
