# Files Manager - API Tests

A file management system with authentication, storage, and automatic thumbnail generation for images.

## Commnands for tests
To test all tests.js
```
npm run test tests/all.test.js
```

To test each file change `all.test.js` with `auth.test.js` or `app.test.js` or `redis.test.js` or `db.test.js` or `files.test.js`

## Tested Endpoints

- `GET /status` - Redis and MongoDB status
- `GET /stats` - Number of users and files
- `POST /users` - User creation
- `GET /connect` - Authentication (generates a token)
- `GET /users/me` - Current user information
- `GET /disconnect` - Logout
- `POST /files` - Create folder or upload file/image
- `GET /files/:id` - Get file information
- `GET /files` - List files with pagination
- `PUT /files/:id/publish` - Make a file public
- `PUT /files/:id/unpublish` - Make a file private
- `GET /files/:id/data` - Get file content or thumbnails

## Available Tests

### App Routes (`app.test.js`)
**describe: App Routes**
- **describe: GET /status**
  - `it`: should return status of Redis and MongoDB
  - `it`: should return a JSON response

- **describe: GET /stats**
  - `it`: should return the number of users and files
  - `it`: should return a JSON response

### Authentication Routes (`auth.test.js`)
**describe: Authentication Routes**
- **describe: POST /users**
  - `it`: should create a new user with valid email and password
  - `it`: should return error when email is missing
  - `it`: should return error when password is missing
  - `it`: should return error when user already exists

- **describe: GET /connect**
  - `it`: should return a token with valid credentials
  - `it`: should return error with invalid credentials
  - `it`: should return error without authorization header

- **describe: GET /users/me**
  - `it`: should return current user information with valid token
  - `it`: should return error without token
  - `it`: should return error with invalid token

- **describe: GET /disconnect**
  - `it`: should disconnect user with valid token
  - `it`: should return error without token
  - `it`: should return error with invalid token
  - `it`: should not be able to access user info after disconnect

### Files Routes (`files.test.js`)
**describe: Files Routes**
- **describe: POST /files - Create Folder**
  - `it`: should create a folder at root level
  - `it`: should return error when creating folder without authentication
  - `it`: should return error when name is missing
  - `it`: should return error when type is missing

- **describe: POST /files - Upload Text File**
  - `it`: should upload a text file in a folder
  - `it`: should return error when uploading file without data
  - `it`: should return error when parentId does not exist

- **describe: POST /files - Upload Image**
  - `it`: should upload an image file

- **describe: GET /files/:id**
  - `it`: should retrieve file information by id
  - `it`: should return error for non-existent file
  - `it`: should return error without authentication

- **describe: GET /files - Pagination**
  - `it`: should list files at root level with pagination
  - `it`: should list files in a specific folder
  - `it`: should return error without authentication

- **describe: PUT /files/:id/publish**
  - `it`: should publish a file
  - `it`: should return error for non-existent file
  - `it`: should return error without authentication

- **describe: PUT /files/:id/unpublish**
  - `it`: should unpublish a file
  - `it`: should return error for non-existent file
  - `it`: should return error without authentication

- **describe: GET /files/:id/data**
  - `it`: should retrieve file content for published file
  - `it`: should retrieve image file content
  - `it`: should return error for non-existent file
  - `it`: should retrieve thumbnail with size parameter
  - `it`: should return error for invalid size parameter
  - `it`: should return error when requesting thumbnail for non-image file

### Redis Client (`redis.test.js`)
**describe: Redis Client**
- **describe: isAlive**
  - `it`: should return true when Redis is connected

- **describe: get and set**
  - `it`: should set and get a value from Redis
  - `it`: should return null for non-existent key
  - `it`: should set a value with expiration

- **describe: del**
  - `it`: should delete a key from Redis
  - `it`: should return 0 when deleting non-existent key

- **describe: complex operations**
  - `it`: should handle multiple set/get operations
  - `it`: should handle numeric values as strings

### DB Client (`db.test.js`)
**describe: DB Client**
- **describe: isAlive**
  - `it`: should return true when MongoDB is connected

- **describe: nbUsers**
  - `it`: should return the number of users in the database
  - `it`: should update count after adding a user

- **describe: nbFiles**
  - `it`: should return the number of files in the database
  - `it`: should update count after adding a file

- **describe: database operations**
  - `it`: should access users collection
  - `it`: should access files collection
  - `it`: should handle concurrent count requests

- **describe: connection stability**
  - `it`: should maintain connection after multiple operations
  - `it`: should have db property defined

## Installation and Testing

### 1. Clone the project
```bash
git clone <repo-url>
cd holbertonschool-files_manager
```

### 2. Install Node.js dependencies
```bash
npm install
```

### 3. Install system tools
```bash
apt-get update && apt-get install -y file jq
```

### 4. Python setup (optional for image_upload.py)
```bash
python3 -m venv venv
source venv/bin/activate
pip install requests
```

### 5. Start MongoDB
```bash
# Check if MongoDB is running
ps aux | grep mongod

# If not, start MongoDB
mongod --dbpath /data/db &
```

### 6. Start Redis
```bash
# Check if Redis is running
ps aux | grep redis-server

# If not, start Redis
redis-server &
```

### 7. Verify services are running
```bash
# Verify MongoDB
mongosh --eval "db.runCommand({ ping: 1 })"

# Verify Redis
redis-cli ping
# Should return: PONG
```

### 8. Start the API server
```bash
npm run start-server
# Server starts on http://0.0.0.0:5000
```

### 9. Start the worker (in another terminal)
```bash
npm run start-worker
```

### 10. Run the tests
```bash
npm run test tests/all.test.js
```

## Architecture

```
MongoDB             → Metadata storage (users, files, folders)
Redis               → Session cache + Bull Queue
/tmp/files_manager/ → Physical file storage (UUID)
Bull Queue          → Asynchronous thumbnail processing
```

## Technologies

- Node.js + Express
- MongoDB (data storage)
- Redis (sessions + queues)
- Bull (async queues)
- Mocha + Chai (testing)
- image-thumbnail (thumbnail generation: 100px, 250px, 500px)
