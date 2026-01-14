import { expect } from 'chai';
import redisClient from '../utils/redis';

describe('Redis Client', () => {
  before((done) => {
    setTimeout(() => {
      done();
    }, 1000);
  });

  describe('isAlive', () => {
    it('should return true when Redis is connected', () => {
      expect(redisClient.isAlive()).to.equal(true);
    });
  });

  describe('get and set', () => {
    it('should set and get a value from Redis', async () => {
      const key = 'test_key';
      const value = 'test_value';

      await redisClient.set(key, value, 10);
      const result = await redisClient.get(key);

      expect(result).to.equal(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await redisClient.get('non_existent_key_12345');
      expect(result).to.be.null;
    });

    it('should set a value with expiration', async () => {
      const key = 'test_expiring_key';
      const value = 'expiring_value';

      await redisClient.set(key, value, 1);
      const result = await redisClient.get(key);
      expect(result).to.equal(value);

      await new Promise(resolve => setTimeout(resolve, 1500));
      const expiredResult = await redisClient.get(key);
      expect(expiredResult).to.be.null;
    });
  });

  describe('del', () => {
    it('should delete a key from Redis', async () => {
      const key = 'test_delete_key';
      const value = 'delete_value';

      await redisClient.set(key, value, 10);
      let result = await redisClient.get(key);
      expect(result).to.equal(value);

      await redisClient.del(key);
      result = await redisClient.get(key);
      expect(result).to.be.null;
    });

    it('should return 0 when deleting non-existent key', async () => {
      const result = await redisClient.del('non_existent_delete_key');
      expect(result).to.equal(0);
    });
  });

  describe('complex operations', () => {
    it('should handle multiple set/get operations', async () => {
      const operations = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' },
      ];

      for (const op of operations) {
        await redisClient.set(op.key, op.value, 10);
      }

      for (const op of operations) {
        const result = await redisClient.get(op.key);
        expect(result).to.equal(op.value);
      }

      for (const op of operations) {
        await redisClient.del(op.key);
      }
    });

    it('should handle numeric values as strings', async () => {
      const key = 'numeric_key';
      const value = '12345';

      await redisClient.set(key, value, 10);
      const result = await redisClient.get(key);
      expect(result).to.equal(value);

      await redisClient.del(key);
    });
  });
});
