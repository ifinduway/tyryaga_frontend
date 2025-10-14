import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Регистрация
router.post("/register", async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    // Валидация
    if (!email || !password || !nickname) {
      return res.status(400).json({
        ok: false,
        error: "Все поля обязательны для заполнения",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        error: "Пароль должен содержать минимум 6 символов",
      });
    }

    if (nickname.length < 3 || nickname.length > 20) {
      return res.status(400).json({
        ok: false,
        error: "Никнейм должен содержать от 3 до 20 символов",
      });
    }

    // Проверка на существование пользователя
    const existingUser = await User.findOne({
      $or: [{ email }, { nickname }],
    });

    if (existingUser) {
      return res.status(400).json({
        ok: false,
        error:
          existingUser.email === email
            ? "Пользователь с таким email уже существует"
            : "Пользователь с таким никнеймом уже существует",
      });
    }

    // Хеширование пароля
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Создание пользователя
    const user = new User({
      email,
      passwordHash,
      nickname,
    });

    await user.save();

    // Генерация JWT токена
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      ok: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          nickname: user.nickname,
          level: user.level,
          exp: user.exp,
          money: user.money,
          respect: user.respect,
          energy: user.energy,
        },
      },
    });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res.status(500).json({
      ok: false,
      error: "Ошибка при создании аккаунта",
    });
  }
});

// Вход
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Валидация
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email и пароль обязательны",
      });
    }

    // Поиск пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Неверный email или пароль",
      });
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        error: "Неверный email или пароль",
      });
    }

    // Восстановление энергии
    user.restoreEnergy();
    user.online = true;
    user.lastSeen = new Date();
    await user.save();

    // Генерация JWT токена
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    res.json({
      ok: true,
      data: {
        token,
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
    console.error("Ошибка входа:", error);
    res.status(500).json({
      ok: false,
      error: "Ошибка при входе в систему",
    });
  }
});

// Проверка токена
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "Токен не предоставлен",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    );
    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Пользователь не найден",
      });
    }

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
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        ok: false,
        error: "Недействительный токен",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        error: "Токен истек",
      });
    }

    console.error("Ошибка проверки токена:", error);
    res.status(500).json({
      ok: false,
      error: "Ошибка проверки токена",
    });
  }
});

export default router;
