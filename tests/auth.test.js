import { expect } from 'chai';
import request from 'request';

const BASE_URL = 'http://0.0.0.0:5000';
let testToken = null;
let testUserId = null;

describe('Authentication Routes', () => {
  describe('POST /users', () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    it('should create a new user with valid email and password', (done) => {
      const options = {
        url: `${BASE_URL}/users`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(201);
        const data = JSON.parse(body);
        expect(data).to.have.property('id');
        expect(data).to.have.property('email');
        expect(data.email).to.equal(testEmail);
        expect(data).to.not.have.property('password');
        testUserId = data.id;
        done();
      });
    });

    it('should return error when email is missing', (done) => {
      const options = {
        url: `${BASE_URL}/users`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: testPassword }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(400);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Missing email');
        done();
      });
    });

    it('should return error when password is missing', (done) => {
      const options = {
        url: `${BASE_URL}/users`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(400);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Missing password');
        done();
      });
    });

    it('should return error when user already exists', (done) => {
      const options = {
        url: `${BASE_URL}/users`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(400);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Already exist');
        done();
      });
    });
  });

  describe('GET /connect', () => {
    const testEmail = 'sylvain@durif.com';
    const testPassword = 'Le.Christ.Cosmique';

    it('should return a token with valid credentials', (done) => {
      const authString = Buffer.from(`${testEmail}:${testPassword}`).toString(
        'base64',
      );
      const options = {
        url: `${BASE_URL}/connect`,
        method: 'GET',
        headers: { Authorization: `Basic ${authString}` },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        const data = JSON.parse(body);
        expect(data).to.have.property('token');
        expect(data.token).to.be.a('string');
        expect(data.token).to.have.lengthOf.at.least(1);
        testToken = data.token;
        done();
      });
    });

    it('should return error with invalid credentials', (done) => {
      const authString = Buffer.from(
        'invalid@email.com:wrongpassword',
      ).toString('base64');
      const options = {
        url: `${BASE_URL}/connect`,
        method: 'GET',
        headers: { Authorization: `Basic ${authString}` },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(401);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Unauthorized');
        done();
      });
    });

    it('should return error without authorization header', (done) => {
      const options = {
        url: `${BASE_URL}/connect`,
        method: 'GET',
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(401);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Unauthorized');
        done();
      });
    });
  });

  describe('GET /users/me', () => {
    it('should return current user information with valid token', (done) => {
      const options = {
        url: `${BASE_URL}/users/me`,
        method: 'GET',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        const data = JSON.parse(body);
        expect(data).to.have.property('id');
        expect(data).to.have.property('email');
        expect(data).to.not.have.property('password');
        done();
      });
    });

    it('should return error without token', (done) => {
      const options = {
        url: `${BASE_URL}/users/me`,
        method: 'GET',
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(401);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Unauthorized');
        done();
      });
    });

    it('should return error with invalid token', (done) => {
      const options = {
        url: `${BASE_URL}/users/me`,
        method: 'GET',
        headers: { 'X-Token': 'invalid-token-12345' },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(401);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Unauthorized');
        done();
      });
    });
  });

  describe('GET /disconnect', () => {
    it('should disconnect user with valid token', (done) => {
      const options = {
        url: `${BASE_URL}/disconnect`,
        method: 'GET',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(204);
        expect(body).to.be.empty;
        done();
      });
    });

    it('should return error without token', (done) => {
      const options = {
        url: `${BASE_URL}/disconnect`,
        method: 'GET',
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(401);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Unauthorized');
        done();
      });
    });

    it('should return error with invalid token', (done) => {
      const options = {
        url: `${BASE_URL}/disconnect`,
        method: 'GET',
        headers: { 'X-Token': 'invalid-token-12345' },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(401);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Unauthorized');
        done();
      });
    });

    it('should not be able to access user info after disconnect', (done) => {
      const options = {
        url: `${BASE_URL}/users/me`,
        method: 'GET',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(401);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Unauthorized');
        done();
      });
    });
  });
});
