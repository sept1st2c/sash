/**
 * lib/redis.ts
 *
 * Exports a singleton Upstash Redis client instance.
 *
 * WHY UPSTASH: Regular Redis requires a persistent TCP connection, which
 * doesn't work in serverless/edge environments (Vercel). Upstash provides
 * an HTTP-based Redis API that works perfectly in serverless.
 *
 * EXPORTS:
 *   redis — the Redis client, ready to use anywhere in the app.
 */

import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
