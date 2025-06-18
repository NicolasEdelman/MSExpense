import { createClient, type RedisClientType } from 'redis';
import dotenv from "dotenv";
dotenv.config();

class Cache {
  private static instance: Cache;
  private redisClient: RedisClientType;
  private isConnected = false;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  private constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    this.redisClient.on('connect', () => {
      this.isConnected = true;
      console.log('Redis connected successfully');
    });

    this.redisClient.on('error', (error) => {
      this.isConnected = false;
      console.error('Redis connection error:', error);
    });

    // Connect the client
    this.redisClient.connect().catch(console.error);
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  async healthcheck(): Promise<boolean> {
    try {
      await this.redisClient.ping();
      return true;
    } catch (error) {
      console.error('Redis healthcheck failed:', error);
      return false;
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T | null> {
    if (!this.isConnected) {
      console.warn('Redis is not connected, operation skipped');
      return null;
    }

    try {
      return await operation();
    } catch (error) {
      console.error('Redis operation failed:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    const result = await this.executeWithRetry(async () => {
      if (ttl) {
        await this.redisClient.setEx(key, ttl, value);
      } else {
        await this.redisClient.set(key, value);
      }
      return true;
    });
    return result ?? false;
  }

  async get(key: string): Promise<string | null> {
    return await this.executeWithRetry(() => this.redisClient.get(key)) ?? null;
  }

  async del(key: string): Promise<boolean> {
    const result = await this.executeWithRetry(async () => {
      await this.redisClient.del(key);
      return true;
    });
    return result ?? false;
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.executeWithRetry(() => this.redisClient.keys(pattern)) ?? [];
  }
}

const cache = Cache.getInstance();
export default cache;
