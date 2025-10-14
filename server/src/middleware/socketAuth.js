import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
