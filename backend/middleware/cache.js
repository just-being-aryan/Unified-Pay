import redis from "../config/redis.js";

export const cache = (keyFn, ttl = 60) => async (req, res, next) => {
  const key = keyFn(req);

  const cached = await redis.get(key);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    await redis.setex(key, ttl, JSON.stringify(data));
    originalJson(data);
  };

  next();
};
