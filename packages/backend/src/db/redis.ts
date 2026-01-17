/**
 * Redis Client for Caching and Pub/Sub
 * 
 * In development without Redis, gracefully degrades to no-op.
 */

import Redis from 'ioredis';
import { config } from '../config/index.js';

// =============================================================================
// REDIS CONNECTION (OPTIONAL)
// =============================================================================

let redis: Redis | null = null;
let redisSub: Redis | null = null;
let redisPub: Redis | null = null;
let redisAvailable = false;

function createRedisClient(): Redis | null {
  if (!config.redis.url) {
    console.log('⚠️  REDIS_URL not set - caching disabled (OK for development)');
    return null;
  }

  try {
    const client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.log('⚠️  Redis connection failed - continuing without cache');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
      lazyConnect: true,
    });

    return client;
  } catch (err) {
    console.log('⚠️  Redis unavailable - continuing without cache');
    return null;
  }
}

// Initialize Redis clients
async function initRedis(): Promise<void> {
  redis = createRedisClient();
  
  if (redis) {
    try {
      await redis.connect();
      redisAvailable = true;
      console.log('🔴 Redis connection established');
      
      redisSub = createRedisClient();
      redisPub = createRedisClient();
      await redisSub?.connect();
      await redisPub?.connect();
    } catch (err) {
      console.log('⚠️  Redis connection failed - caching disabled');
      redis = null;
      redisAvailable = false;
    }
  }
}

// Initialize on module load (async)
initRedis().catch(() => {});

redis?.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
  redisAvailable = false;
});

// =============================================================================
// CACHE HELPERS (WITH FALLBACK)
// =============================================================================

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && redis !== null;
}

/**
 * Get value from cache (returns null if Redis unavailable)
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis || !redisAvailable) return null;
  
  try {
    const value = await redis.get(key);
    if (!value) return null;
    
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Set value in cache with optional TTL (no-op if Redis unavailable)
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL
): Promise<void> {
  if (!redis || !redisAvailable) return;
  
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await redis.setex(key, ttlSeconds, serialized);
  } catch {
    // Silently fail - caching is optional
  }
}

/**
 * Delete from cache (no-op if Redis unavailable)
 */
export async function cacheDel(key: string): Promise<void> {
  if (!redis || !redisAvailable) return;
  
  try {
    await redis.del(key);
  } catch {
    // Silently fail
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redis || !redisAvailable) return;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silently fail
  }
}

// =============================================================================
// NEURAL STATE CACHE
// =============================================================================

/**
 * Get neural state from cache
 */
export async function getNeuralStateCache(
  userId: string,
  projectId: string
): Promise<unknown | null> {
  return cacheGet(`neural:${userId}:${projectId}`);
}

/**
 * Set neural state in cache
 */
export async function setNeuralStateCache(
  userId: string,
  projectId: string,
  state: unknown
): Promise<void> {
  await cacheSet(`neural:${userId}:${projectId}`, state, 300); // 5 min TTL
}

/**
 * Invalidate neural state cache
 */
export async function invalidateNeuralStateCache(
  userId: string,
  projectId: string
): Promise<void> {
  await cacheDel(`neural:${userId}:${projectId}`);
}

// =============================================================================
// PUB/SUB (WITH FALLBACK)
// =============================================================================

/**
 * Publish message (no-op if Redis unavailable)
 */
export async function publish(channel: string, message: unknown): Promise<void> {
  if (!redisPub || !redisAvailable) return;
  
  try {
    await redisPub.publish(channel, JSON.stringify(message));
  } catch {
    // Silently fail
  }
}

/**
 * Subscribe to channel (no-op if Redis unavailable)
 */
export async function subscribe(
  channel: string,
  handler: (message: unknown) => void
): Promise<void> {
  if (!redisSub || !redisAvailable) return;
  
  try {
    await redisSub.subscribe(channel);
    redisSub.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          handler(JSON.parse(msg));
        } catch {
          handler(msg);
        }
      }
    });
  } catch {
    // Silently fail
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { redis, redisSub, redisPub };

// =============================================================================
// SHUTDOWN
// =============================================================================

export async function closeRedis(): Promise<void> {
  if (redis) await redis.quit().catch(() => {});
  if (redisSub) await redisSub.quit().catch(() => {});
  if (redisPub) await redisPub.quit().catch(() => {});
  console.log('🔴 Redis connections closed');
}
