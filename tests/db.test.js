import { expect } from 'chai';
import dbClient from '../utils/db';

describe('DB Client', () => {
  before((done) => {
    // Wait for MongoDB to connect
    const checkConnection = setInterval(() => {
      if (dbClient.isAlive()) {
        clearInterval(checkConnection);
        done();
      }
    }, 100);
  });

  describe('isAlive', () => {
    it('should return true when MongoDB is connected', () => {
      expect(dbClient.isAlive()).to.equal(true);
    });
  });

  describe('nbUsers', () => {
    it('should return the number of users in the database', async () => {
      const count = await dbClient.nbUsers();
      expect(count).to.be.a('number');
      expect(count).to.be.at.least(0);
    });

    it('should update count after adding a user', async () => {
      const initialCount = await dbClient.nbUsers();

      // Add a test user
      const testUser = {
        email: `test_db_${Date.now()}@example.com`,
        password: 'hashedpassword123',
      };

      await dbClient.db.collection('users').insertOne(testUser);

      const newCount = await dbClient.nbUsers();
      expect(newCount).to.equal(initialCount + 1);

      // Clean up
      await dbClient.db.collection('users').deleteOne({ email: testUser.email });
    });
  });

  describe('nbFiles', () => {
    it('should return the number of files in the database', async () => {
      const count = await dbClient.nbFiles();
      expect(count).to.be.a('number');
      expect(count).to.be.at.least(0);
    });

    it('should update count after adding a file', async () => {
      const initialCount = await dbClient.nbFiles();

      // Add a test file
      const testFile = {
        name: `test_file_${Date.now()}.txt`,
        type: 'file',
        userId: '507f1f77bcf86cd799439011', // Mock ObjectId
      };

      const result = await dbClient.db.collection('files').insertOne(testFile);

      const newCount = await dbClient.nbFiles();
      expect(newCount).to.equal(initialCount + 1);

      // Clean up
      await dbClient.db.collection('files').deleteOne({ _id: result.insertedId });
    });
  });

  describe('database operations', () => {
    it('should access users collection', async () => {
      const usersCollection = dbClient.db.collection('users');
      expect(usersCollection).to.not.be.undefined;

      const count = await usersCollection.countDocuments();
      expect(count).to.be.a('number');
    });

    it('should access files collection', async () => {
      const filesCollection = dbClient.db.collection('files');
      expect(filesCollection).to.not.be.undefined;

      const count = await filesCollection.countDocuments();
      expect(count).to.be.a('number');
    });

    it('should handle concurrent count requests', async () => {
      const promises = [
        dbClient.nbUsers(),
        dbClient.nbFiles(),
        dbClient.nbUsers(),
        dbClient.nbFiles(),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).to.equal(results[2]); // Both user counts should be same
      expect(results[1]).to.equal(results[3]); // Both file counts should be same
    });
  });

  describe('connection stability', () => {
    it('should maintain connection after multiple operations', async () => {
      expect(dbClient.isAlive()).to.equal(true);

      await dbClient.nbUsers();
      expect(dbClient.isAlive()).to.equal(true);

      await dbClient.nbFiles();
      expect(dbClient.isAlive()).to.equal(true);
    });

    it('should have db property defined', () => {
      expect(dbClient.db).to.not.be.undefined;
      expect(dbClient.db).to.not.be.null;
    });
  });
});
