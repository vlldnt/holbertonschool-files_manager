import { expect } from 'chai';
import request from 'request';

const BASE_URL = 'http://0.0.0.0:5000';

describe('App Routes', () => {
  describe('GET /status', () => {
    it('should return status of Redis and MongoDB', (done) => {
      request.get(`${BASE_URL}/status`, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        const data = JSON.parse(body);
        expect(data).to.have.property('redis');
        expect(data).to.have.property('db');
        expect(data.redis).to.be.a('boolean');
        expect(data.db).to.be.a('boolean');
        done();
      });
    });

    it('should return a JSON response', (done) => {
      request.get(`${BASE_URL}/status`, (error, response) => {
        expect(error).to.be.null;
        expect(response.headers['content-type']).to.include('application/json');
        done();
      });
    });
  });

  describe('GET /stats', () => {
    it('should return the number of users and files', (done) => {
      request.get(`${BASE_URL}/stats`, (error, response, body) => {
        expect(response.statusCode).to.equal(200);
        const data = JSON.parse(body);
        expect(data).to.have.property('users');
        expect(data).to.have.property('files');
        expect(data.users).to.be.a('number');
        expect(data.files).to.be.a('number');
        expect(data.users).to.be.at.least(0);
        expect(data.files).to.be.at.least(0);
        done();
      });
    });

    it('should return a JSON response', (done) => {
      request.get(`${BASE_URL}/stats`, (error, response) => {
        expect(error).to.be.null;
        expect(response.headers['content-type']).to.include('application/json');
        done();
      });
    });
  });
});
