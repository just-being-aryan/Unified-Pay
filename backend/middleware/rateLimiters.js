import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../config/redis.js";

// helper to create NEW store each time
const createStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix,
  });

// GLOBAL
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:global:"),
});

// AUTH
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many auth attempts",
  store: createStore("rl:auth:"),
});

// PAYMENT INIT
export const paymentInitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  message: "Too many payment attempts",
  store: createStore("rl:payment:"),
});

// DASHBOARD
export const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  message: "Dashboard refresh limit reached",
  store: createStore("rl:dashboard:"),
});
