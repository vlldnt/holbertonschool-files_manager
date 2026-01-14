import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.db.collection('files').findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });
  if (!file) {
    throw new Error('File not found');
  }

  const widths = [500, 250, 100];

  await Promise.all(
    widths.map(async (size) => {
      const thumbnail = await imageThumbnail(file.localPath, {
        width: size,
        responseType: 'buffer',
      });

      const outputPath = `${file.localPath}_${size}`;

      await fs.writeFile(outputPath, thumbnail);
    }),
  );
});

userQueue.process(async (job) => {
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
  console.log(`Welcome ${user.email}`);
});
