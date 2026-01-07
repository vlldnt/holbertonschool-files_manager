import dbClient from '../utils/db';
import crypto from 'crypto';

class UserController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const existingEmail = await dbClient.db
      .collection('users')
      .findOne({ email });

    if (existingEmail) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPWD = crypto.createHash('sha1').update(password).digest('hex');

    const newUser = { email, password: hashedPWD };
    const result = await dbClient.db.collection('users').insertOne(newUser);

    return res.status(201).json({ id: result.insertedId, email });
  }
}

export default UserController;
