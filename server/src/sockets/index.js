import { setupSocketHandlers } from './socketHandlers.js';

let io = null;

// Функция для установки экземпляра Socket.io
export const setIO = socketIO => {
  io = socketIO;
};

// Функция для получения экземпляра Socket.io
export const getIO = () => {
  return io;
};

export { setupSocketHandlers };
