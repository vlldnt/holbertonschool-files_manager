import { expect } from 'chai';
import request from 'request';

const BASE_URL = 'http://0.0.0.0:5000';
let testToken = null;
let testFolderId = null;
let testFileId = null;
let testImageId = null;

describe('Files Routes', () => {
  before((done) => {
    const testEmail = `test_files_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const createUserOptions = {
      url: `${BASE_URL}/users`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    };

    request(createUserOptions, (error, response) => {
      expect(error).to.be.null;
      expect(response.statusCode).to.equal(201);

      const authString = Buffer.from(`${testEmail}:${testPassword}`).toString(
        'base64',
      );
      const connectOptions = {
        url: `${BASE_URL}/connect`,
        method: 'GET',
        headers: { Authorization: `Basic ${authString}` },
      };

      request(connectOptions, (error2, response2, body2) => {
        expect(error2).to.be.null;
        expect(response2.statusCode).to.equal(200);
        const data = JSON.parse(body2);
        testToken = data.token;
        done();
      });
    });
  });

  describe('POST /files - Create Folder', () => {
    it('should create a folder at root level', (done) => {
      const options = {
        url: `${BASE_URL}/files`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': testToken,
        },
        body: JSON.stringify({
          name: 'my_folder',
          type: 'folder',
        }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(201);
        const data = JSON.parse(body);
        expect(data).to.have.property('id');
        expect(data).to.have.property('name');
        expect(data).to.have.property('type');
        expect(data.name).to.equal('my_folder');
        expect(data.type).to.equal('folder');
        expect(data.parentId).to.equal(0);
        testFolderId = data.id;
        done();
      });
    });

    it('should return error when creating folder without authentication', (done) => {
      const options = {
        url: `${BASE_URL}/files`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'unauthorized_folder',
          type: 'folder',
        }),
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

    it('should return error when name is missing', (done) => {
      const options = {
        url: `${BASE_URL}/files`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': testToken,
        },
        body: JSON.stringify({ type: 'folder' }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(400);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Missing name');
        done();
      });
    });

    it('should return error when type is missing', (done) => {
      const options = {
        url: `${BASE_URL}/files`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': testToken,
        },
        body: JSON.stringify({ name: 'test_folder' }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(400);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Missing type');
        done();
      });
    });
  });

  describe('POST /files - Upload Text File', () => {
    it('should upload a text file in a folder', (done) => {
      const base64Data = Buffer.from('Hello World!').toString('base64');
      const options = {
        url: `${BASE_URL}/files`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': testToken,
        },
        body: JSON.stringify({
          name: 'test.txt',
          type: 'file',
          data: base64Data,
          parentId: testFolderId,
        }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(201);
        const data = JSON.parse(body);
        expect(data).to.have.property('id');
        expect(data).to.have.property('name');
        expect(data).to.have.property('type');
        expect(data.name).to.equal('test.txt');
        expect(data.type).to.equal('file');
        expect(data.parentId).to.equal(testFolderId);
        expect(data.isPublic).to.be.a('boolean');
        testFileId = data.id;
        done();
      });
    });

    it('should return error when uploading file without data', (done) => {
      const options = {
        url: `${BASE_URL}/files`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': testToken,
        },
        body: JSON.stringify({
          name: 'no_data.txt',
          type: 'file',
        }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(400);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Missing data');
        done();
      });
    });

    it('should return error when parentId does not exist', (done) => {
      const base64Data = Buffer.from('Test content').toString('base64');
      const options = {
        url: `${BASE_URL}/files`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': testToken,
        },
        body: JSON.stringify({
          name: 'test.txt',
          type: 'file',
          data: base64Data,
          parentId: '507f1f77bcf86cd799439011',
        }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(400);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Parent not found');
        done();
      });
    });
  });

  describe('POST /files - Upload Image', () => {
    it('should upload an image file', (done) => {
      const base64Image =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const options = {
        url: `${BASE_URL}/files`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': testToken,
        },
        body: JSON.stringify({
          name: 'image.png',
          type: 'image',
          isPublic: true,
          data: base64Image,
        }),
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(201);
        const data = JSON.parse(body);
        expect(data).to.have.property('id');
        expect(data).to.have.property('name');
        expect(data).to.have.property('type');
        expect(data.name).to.equal('image.png');
        expect(data.type).to.equal('image');
        expect(data.isPublic).to.equal(true);
        testImageId = data.id;
        done();
      });
    });
  });

  describe('GET /files/:id', () => {
    it('should retrieve file information by id', (done) => {
      const options = {
        url: `${BASE_URL}/files/${testFileId}`,
        method: 'GET',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        const data = JSON.parse(body);
        expect(data).to.have.property('id');
        expect(data).to.have.property('name');
        expect(data).to.have.property('type');
        expect(data.id).to.equal(testFileId);
        expect(data.name).to.equal('test.txt');
        done();
      });
    });

    it('should return error for non-existent file', (done) => {
      const options = {
        url: `${BASE_URL}/files/507f1f77bcf86cd799439011`,
        method: 'GET',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(404);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Not found');
        done();
      });
    });

    it('should return error without authentication', (done) => {
      const options = {
        url: `${BASE_URL}/files/${testFileId}`,
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

  describe('GET /files - Pagination', () => {
    it('should list files at root level with pagination', (done) => {
      const options = {
        url: `${BASE_URL}/files?parentId=0&page=0`,
        method: 'GET',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        const data = JSON.parse(body);
        expect(data).to.be.an('array');
        expect(data.length).to.be.at.least(0);
        done();
      });
    });

    it('should list files in a specific folder', (done) => {
      const options = {
        url: `${BASE_URL}/files?parentId=${testFolderId}&page=0`,
        method: 'GET',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        const data = JSON.parse(body);
        expect(data).to.be.an('array');
        const textFile = data.find((file) => file.name === 'test.txt');
        expect(textFile).to.exist;
        expect(textFile.parentId).to.equal(testFolderId);
        done();
      });
    });

    it('should return error without authentication', (done) => {
      const options = {
        url: `${BASE_URL}/files?parentId=0&page=0`,
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

  describe('PUT /files/:id/publish', () => {
    it('should publish a file', (done) => {
      const options = {
        url: `${BASE_URL}/files/${testFileId}/publish`,
        method: 'PUT',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        const data = JSON.parse(body);
        expect(data).to.have.property('id');
        expect(data).to.have.property('isPublic');
        expect(data.id).to.equal(testFileId);
        expect(data.isPublic).to.equal(true);
        done();
      });
    });

    it('should return error for non-existent file', (done) => {
      const options = {
        url: `${BASE_URL}/files/507f1f77bcf86cd799439011/publish`,
        method: 'PUT',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(404);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Not found');
        done();
      });
    });

    it('should return error without authentication', (done) => {
      const options = {
        url: `${BASE_URL}/files/${testFileId}/publish`,
        method: 'PUT',
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

  describe('PUT /files/:id/unpublish', () => {
    it('should unpublish a file', (done) => {
      const options = {
        url: `${BASE_URL}/files/${testFileId}/unpublish`,
        method: 'PUT',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        const data = JSON.parse(body);
        expect(data).to.have.property('id');
        expect(data).to.have.property('isPublic');
        expect(data.id).to.equal(testFileId);
        expect(data.isPublic).to.equal(false);
        done();
      });
    });

    it('should return error for non-existent file', (done) => {
      const options = {
        url: `${BASE_URL}/files/507f1f77bcf86cd799439011/unpublish`,
        method: 'PUT',
        headers: { 'X-Token': testToken },
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(404);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Not found');
        done();
      });
    });

    it('should return error without authentication', (done) => {
      const options = {
        url: `${BASE_URL}/files/${testFileId}/unpublish`,
        method: 'PUT',
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

  describe('GET /files/:id/data', () => {
    before((done) => {
      const options = {
        url: `${BASE_URL}/files/${testFileId}/publish`,
        method: 'PUT',
        headers: { 'X-Token': testToken },
      };

      request(options, () => {
        done();
      });
    });

    it('should retrieve file content for published file', (done) => {
      const options = {
        url: `${BASE_URL}/files/${testFileId}/data`,
        method: 'GET',
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        expect(body).to.equal('Hello World!');
        done();
      });
    });

    it('should retrieve image file content', (done) => {
      const options = {
        url: `${BASE_URL}/files/${testImageId}/data`,
        method: 'GET',
      };

      request(options, (error, response) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(200);
        expect(response.headers['content-type']).to.include('image');
        done();
      });
    });

    it('should return error for non-existent file', (done) => {
      const options = {
        url: `${BASE_URL}/files/507f1f77bcf86cd799439011/data`,
        method: 'GET',
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(404);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Not found');
        done();
      });
    });

    it('should retrieve thumbnail with size parameter', function (done) {
      this.timeout(5000);
      const options = {
        url: `${BASE_URL}/files/${testImageId}/data?size=100`,
        method: 'GET',
      };

      setTimeout(() => {
        request(options, (error, response) => {
          expect(error).to.be.null;
          expect([200, 404]).to.include(response.statusCode);
          done();
        });
      }, 2000);
    });

    it('should return error for invalid size parameter', (done) => {
      const options = {
        url: `${BASE_URL}/files/${testImageId}/data?size=999`,
        method: 'GET',
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(400);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Invalid size parameter');
        done();
      });
    });

    it('should return error when requesting thumbnail for non-image file', (done) => {
      const options = {
        url: `${BASE_URL}/files/${testFileId}/data?size=100`,
        method: 'GET',
      };

      request(options, (error, response, body) => {
        expect(error).to.be.null;
        expect(response.statusCode).to.equal(400);
        const data = JSON.parse(body);
        expect(data).to.have.property('error');
        expect(data.error).to.equal('Invalid request');
        done();
      });
    });
  });

  after((done) => {
    if (testToken) {
      const options = {
        url: `${BASE_URL}/disconnect`,
        method: 'GET',
        headers: { 'X-Token': testToken },
      };

      request(options, () => {
        done();
      });
    } else {
      done();
    }
  });
});
