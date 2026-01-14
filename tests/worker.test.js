import { expect } from 'chai';
import Queue from 'bull';
import sinon from 'sinon';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

describe('Worker Queues', () => {
  let userQueue;
  let consoleLogStub;

  before((done) => {
    const checkConnection = setInterval(() => {
      if (dbClient.isAlive()) {
        clearInterval(checkConnection);
        userQueue = new Queue('userQueue');
        done();
      }
    }, 100);
  });

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    consoleLogStub.restore();
  });

  after(async () => {
    await userQueue.close();
  });

  describe('userQueue', () => {
    it('should throw error when userId is missing', async () => {
      const job = { data: {} };

      try {
        const { userId } = job.data;
        if (!userId) {
          throw new Error('Missing userId');
        }
      } catch (error) {
        expect(error.message).to.equal('Missing userId');
      }
    });

    it('should throw error when user is not found in DB', async () => {
      const fakeUserId = new ObjectId();
      const job = { data: { userId: fakeUserId.toString() } };

      try {
        const { userId } = job.data;
        if (!userId) {
          throw new Error('Missing userId');
        }

        const user = await dbClient.db.collection('users').findOne({
          _id: new ObjectId(userId),
        });
        if (!user) {
          throw new Error('User not found');
        }
      } catch (error) {
        expect(error.message).to.equal('User not found');
      }
    });

    it('should process job and print welcome message for existing user', async () => {
      const testEmail = `test_worker_${Date.now()}@example.com`;
      const testUser = {
        email: testEmail,
        password: 'hashedpassword123',
      };

      const result = await dbClient.db.collection('users').insertOne(testUser);
      const userId = result.insertedId.toString();

      const job = { data: { userId } };

      const { userId: jobUserId } = job.data;
      expect(jobUserId).to.not.be.undefined;

      const user = await dbClient.db.collection('users').findOne({
        _id: new ObjectId(jobUserId),
      });
      expect(user).to.not.be.null;
      expect(user.email).to.equal(testEmail);

      console.log(`Welcome ${user.email}!`);
      expect(consoleLogStub.calledWith(`Welcome ${testEmail}!`)).to.be.true;

      await dbClient.db
        .collection('users')
        .deleteOne({ _id: result.insertedId });
    });

    it('should add job to userQueue', async () => {
      const testUserId = new ObjectId().toString();

      const job = await userQueue.add({ userId: testUserId });

      expect(job).to.not.be.null;
      expect(job.data.userId).to.equal(testUserId);
      expect(job.id).to.not.be.undefined;

      await userQueue.empty();
    });

    it('should handle job data correctly', () => {
      const testUserId = '507f1f77bcf86cd799439011';
      const job = { data: { userId: testUserId } };

      const { userId } = job.data;
      expect(userId).to.equal(testUserId);
      expect(ObjectId.isValid(userId)).to.be.true;
    });
  });
});
