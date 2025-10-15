import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Импорт маршрутов
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
// import bossRoutes from './routes/boss.js'; // Старые роуты (можно удалить после полного перехода)
import bossTemplateRoutes from './routes/bossTemplate.js';
import bossInstanceRoutes from './routes/bossInstance.js';
import clanRoutes from './routes/clan.js';
import itemRoutes from './routes/item.js';
import workRoutes from './routes/work.js';
import friendRoutes from './routes/friend.js';

// Импорт middleware
import { authenticateToken } from './middleware/auth.js';
import { socketAuth } from './middleware/socketAuth.js';

// Импорт socket обработчиков
import { setupSocketHandlers, setIO } from './sockets/index.js';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (более мягкие настройки для разработки)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10000000, // максимум 1000 запросов с одного IP (увеличено для разработки)
  message: 'Слишком много запросов с этого IP, попробуйте позже'
});
app.use('/api/', limiter);

// Более мягкий лимит для аутентификации в режиме разработки
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // увеличено с 5 до 50 для разработки
  message: 'Слишком много попыток входа, попробуйте позже'
});

// Сброс rate limit в режиме разработки
if (process.env.NODE_ENV === 'development') {
  app.post('/api/reset-rate-limit', (req, res) => {
    // Сбрасываем rate limit для всех IP
    limiter.resetKey(req.ip);
    authLimiter.resetKey(req.ip);
    res.json({ message: 'Rate limit сброшен для разработки' });
  });
}

// Маршруты
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
// Новые роуты боссов (более специфичные должны быть выше)
app.use('/api/boss/template', bossTemplateRoutes);
app.use('/api/boss/instance', bossInstanceRoutes);
// Старые роуты боссов (можно удалить после полного перехода на новую систему)
// app.use('/api/boss', authenticateToken, bossRoutes);
app.use('/api/clan', authenticateToken, clanRoutes);
app.use('/api/item', authenticateToken, itemRoutes);
app.use('/api/work', authenticateToken, workRoutes);
app.use('/api/friends', authenticateToken, friendRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io middleware для аутентификации
io.use(socketAuth);

// Сохраняем экземпляр io для использования в других модулях
setIO(io);

// Настройка socket обработчиков
setupSocketHandlers(io);

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({
    ok: false,
    error: 'Внутренняя ошибка сервера',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Что-то пошло не так'
  });
});

// 404 обработчик
app.use('*', (req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Маршрут не найден'
  });
});

// Подключение к MongoDB
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/tyuryaga';
    await mongoose.connect(mongoURI);
    console.log('✅ Подключение к MongoDB установлено');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
  }
};

// Запуск сервера
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📡 Socket.io сервер готов к подключениям`);
    console.log(`🌍 Режим: ${process.env.NODE_ENV || 'development'}`);
  });
};

// Обработка завершения процесса
process.on('SIGTERM', () => {
  console.log('🛑 Получен сигнал SIGTERM, завершение работы...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Получен сигнал SIGINT, завершение работы...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

startServer().catch(console.error);

export { io };
