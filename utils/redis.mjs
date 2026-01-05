import { createClient } from "redis";

export class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on("error", (err) => {
      console.error(`Redis client error: ${err}`);
    });
    this.client.connect();
  }
  isAlive() {
    if (this.client.isOpen) {
      return true;
    } else {
      return false;
    }
  }

  async get(key) {
    const value = await this.client.get(key);
    return value;
  }

  async set(key, value, duration) {
    await this.client.set(key, value, { EX: duration });
  }

  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
