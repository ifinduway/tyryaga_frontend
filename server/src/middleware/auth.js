import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware для проверки JWT токена в HTTP запросах
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "Токен доступа не предоставлен",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    );

    // Проверяем, что пользователь существует
    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Пользователь не найден",
      });
    }

    req.user = user;
    next();
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

    console.error("Ошибка аутентификации:", error);
    return res.status(500).json({
      ok: false,
      error: "Ошибка аутентификации",
    });
  }
};

// Middleware для проверки JWT токена в Socket.io
export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Токен не предоставлен"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    );

    // Проверяем, что пользователь существует
    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      return next(new Error("Пользователь не найден"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    console.error("Ошибка socket аутентификации:", error);
    next(new Error("Ошибка аутентификации"));
  }
};

// Middleware для проверки роли в клане
export const checkClanRole = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const { clanId } = req.params;
      const userId = req.user._id;

      const Clan = (await import("../models/Clan.js")).default;
      const clan = await Clan.findById(clanId);

      if (!clan) {
        return res.status(404).json({
          ok: false,
          error: "Клан не найден",
        });
      }

      if (!clan.isMember(userId)) {
        return res.status(403).json({
          ok: false,
          error: "Вы не являетесь участником этого клана",
        });
      }

      const userRole = clan.getMemberRole(userId);

      if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
        return res.status(403).json({
          ok: false,
          error: "Недостаточно прав для выполнения этого действия",
        });
      }

      req.clan = clan;
      req.userRole = userRole;
      next();
    } catch (error) {
      console.error("Ошибка проверки роли клана:", error);
      return res.status(500).json({
        ok: false,
        error: "Ошибка проверки прав доступа",
      });
    }
  };
};
