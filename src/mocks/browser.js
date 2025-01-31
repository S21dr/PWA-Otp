import { setupWorker } from 'msw/browser';
import { handlers } from "./handlers.js";

// Создаём мок-сервер
export const worker = setupWorker(...handlers);
