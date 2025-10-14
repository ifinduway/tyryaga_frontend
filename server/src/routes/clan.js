import express from "express";
import Clan from "../models/Clan.js";
import User from "../models/User.js";
import { checkClanRole } from "../middleware/auth.js";

const router = express.Router();

// Получение списка кланов
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (page - 1) * limit;

    const query = search ? { name: { $regex: search, $options: "i" } } : {};

    const clans = await Clan.find(query)
      .populate("leaderId", "nickname level")
      .populate("members.userId", "nickname level")
      .sort({ level: -1, exp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Clan.countDocuments(query);

    res.json({
      ok: true,
      data: {
        clans: clans.map((clan) => ({
          id: clan._id,
          name: clan.name,
          description: clan.description,
          level: clan.level,
          exp: clan.exp,
          memberCount: clan.members.length,
          maxMembers: clan.maxMembers,
          bank: clan.bank,
          leader: {
            id: clan.leaderId._id,
            nickname: clan.leaderId.nickname,
            level: clan.leaderId.level,
          },
          createdAt: clan.createdAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Ошибка получения списка кланов:", error);
    res.status(500).json({
      ok: false,
      error: "Ошибка получения списка кланов",
    });
  }
});

// Создание клана
router.post("/", async (req, res) => {
  try {
    const { name, description = "" } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "Название клана обязательно",
      });
    }

    if (name.length < 3 || name.length > 30) {
      return res.status(400).json({
        ok: false,
        error: "Название клана должно содержать от 3 до 30 символов",
      });
    }

    // Проверяем, не состоит ли пользователь уже в клане
    const user = await User.findById(userId);
    if (user.clanId) {
      return res.status(400).json({
        ok: false,
        error: "Вы уже состоите в клане",
      });
    }

    // Проверяем, не существует ли клан с таким именем
    const existingClan = await Clan.findOne({ name });
    if (existingClan) {
      return res.status(400).json({
        ok: false,
        error: "Клан с таким названием уже существует",
      });
    }

    // Создаем клан
    const clan = new Clan({
      name,
      description,
      leaderId: userId,
      members: [
        {
          userId,
          role: "leader",
          joinedAt: new Date(),
        },
      ],
    });

    await clan.save();

    // Обновляем пользователя
    user.clanId = clan._id;
    await user.save();

    res.status(201).json({
      ok: true,
      data: {
        clan: {
          id: clan._id,
          name: clan.name,
          description: clan.description,
          level: clan.level,
          memberCount: clan.memberCount,
          maxMembers: clan.maxMembers,
          bank: clan.bank,
          role: "leader",
        },
      },
    });
  } catch (error) {
    console.error("Ошибка создания клана:", error);
    res.status(500).json({
      ok: false,
      error: "Ошибка создания клана",
    });
  }
});

// Получение информации о клане
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const clan = await Clan.findById(id)
      .populate("leaderId", "nickname level")
      .populate("members.userId", "nickname level online")
      .lean();

    if (!clan) {
      return res.status(404).json({
        ok: false,
        error: "Клан не найден",
      });
    }

    res.json({
      ok: true,
      data: {
        clan: {
          id: clan._id,
          name: clan.name,
          description: clan.description,
          level: clan.level,
          exp: clan.exp,
          memberCount: clan.members.length,
          maxMembers: clan.maxMembers,
          bank: clan.bank,
          leader: {
            id: clan.leaderId._id,
            nickname: clan.leaderId.nickname,
            level: clan.leaderId.level,
          },
          members: clan.members.map((member) => ({
            id: member.userId._id,
            nickname: member.userId.nickname,
            level: member.userId.level,
            role: member.role,
            contribution: member.contribution,
            joinedAt: member.joinedAt,
            online: member.userId.online,
          })),
          createdAt: clan.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Ошибка получения информации о клане:", error);
    res.status(500).json({
      ok: false,
      error: "Ошибка получения информации о клане",
    });
  }
});

// Вступление в клан
router.post("/:id/join", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const clan = await Clan.findById(id);
    if (!clan) {
      return res.status(404).json({
        ok: false,
        error: "Клан не найден",
      });
    }

    const user = await User.findById(userId);
    if (user.clanId) {
      return res.status(400).json({
        ok: false,
        error: "Вы уже состоите в клане",
      });
    }

    if (clan.memberCount >= clan.maxMembers) {
      return res.status(400).json({
        ok: false,
        error: "Клан переполнен",
      });
    }

    clan.addMember(userId);
    await clan.save();

    user.clanId = clan._id;
    await user.save();

    res.json({
      ok: true,
      data: {
        message: "Вы успешно вступили в клан",
        clan: {
          id: clan._id,
          name: clan.name,
          role: "member",
        },
      },
    });
  } catch (error) {
    console.error("Ошибка вступления в клан:", error);
    res.status(500).json({
      ok: false,
      error: error.message || "Ошибка вступления в клан",
    });
  }
});

// Покидание клана
router.post("/:id/leave", checkClanRole(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const clan = await Clan.findById(id);
    const user = await User.findById(userId);

    // Лидер не может покинуть клан
    if (req.userRole === "leader") {
      return res.status(400).json({
        ok: false,
        error:
          "Лидер не может покинуть клан. Передайте лидерство другому участнику",
      });
    }

    clan.removeMember(userId);
    await clan.save();

    user.clanId = null;
    await user.save();

    res.json({
      ok: true,
      data: {
        message: "Вы покинули клан",
      },
    });
  } catch (error) {
    console.error("Ошибка покидания клана:", error);
    res.status(500).json({
      ok: false,
      error: error.message || "Ошибка покидания клана",
    });
  }
});

// Пополнение банка клана
router.post("/:id/deposit", checkClanRole(), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Сумма должна быть больше 0",
      });
    }

    const user = await User.findById(userId);
    if (user.money < amount) {
      return res.status(400).json({
        ok: false,
        error: "Недостаточно средств",
      });
    }

    const clan = await Clan.findById(id);
    clan.deposit(amount);
    await clan.save();

    user.money -= amount;
    await user.save();

    // Обновляем вклад участника
    const member = clan.members.find(
      (m) => m.userId.toString() === userId.toString()
    );
    if (member) {
      member.contribution += amount;
      await clan.save();
    }

    res.json({
      ok: true,
      data: {
        message: `В банк клана внесено ${amount} денег`,
        newBalance: user.money,
        clanBank: clan.bank,
      },
    });
  } catch (error) {
    console.error("Ошибка пополнения банка:", error);
    res.status(500).json({
      ok: false,
      error: error.message || "Ошибка пополнения банка",
    });
  }
});

export default router;
