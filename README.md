# Files Manager - Holberton School

A file management system with authentication, storage, and automatic thumbnail generation for images.

## Features

- ✅ Authentication with Redis (sessions)
- ✅ File storage with MongoDB (metadata)
- ✅ File upload (images, documents)
- ✅ Virtual folder organization
- ✅ Automatic thumbnail generation (100px, 250px, 500px)
- ✅ Bull/Redis queue for asynchronous processing
- ✅ Complete REST API

## Architecture

```
MongoDB             → Metadata storage (users, files, folders)
Redis               → Session cache + Bull Queue
/tmp/files_manager/ → Physical file storage (UUID)
Bull Queue          → Asynchronous thumbnail processing
```

## Prerequisites

- Node.js (v14+)
- MongoDB (v4+)
- Redis (v5+)
- npm
- Python 3 (for image_upload.py script)

## Installation

### 1. Clone the project

```bash
git clone https://github.com/your-repo/holbertonschool-files_manager.git
cd holbertonschool-files_manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install required system tools

```bash
# For the 'file' command (file identification)
apt-get update && apt-get install -y file
```

### 4. Setup Python virtual environment (for image_upload.py script)

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install requests

# When done, you can deactivate with:
# deactivate
```

**Note:** Always activate the virtual environment before using `image_upload.py`:
```bash
source venv/bin/activate
```

## Starting Services

### 1. Start MongoDB

```bash
# Check if MongoDB is running
ps aux | grep mongod

# If not, start MongoDB
mongod --dbpath /data/db &

# Or with systemctl
systemctl start mongod
```

### 2. Start Redis

```bash
# Check if Redis is running
ps aux | grep redis-server

# If not, start Redis
redis-server &

# Or with systemctl
systemctl start redis
```

### 3. Verify services are running

```bash
# Verify MongoDB
mongosh --eval "db.runCommand({ ping: 1 })"

# Verify Redis
redis-cli ping
# Should return: PONG
```

### 4. Start the API server

```bash
npm run start-server
# Server starts on http://0.0.0.0:5000
```

### 5. Start the worker (thumbnail generation)

In another terminal:

```bash
npm run start-worker
```

## Complete Testing Guide

### Step 1: Create a user

```bash
curl -X POST http://0.0.0.0:5000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Response:**
```json
{
  "id": "USER_ID",
  "email": "test@example.com"
}
```

### Step 2: Connect

```bash
# Encode your credentials in base64
echo -n "test@example.com:password123" | base64
# Result: dGVzdEBleGFtcGxlLmNvbTpwYXNzd29yZDEyMw==

# Connect
curl -X GET http://0.0.0.0:5000/connect \
  -H "Authorization: Basic dGVzdEBleGFtcGxlLmNvbTpwYXNzd29yZDEyMw=="
```

**Response:**
```json
{
  "token": "YOUR_TOKEN_HERE"
}
```

**⚠️ Important:** Save your TOKEN, you'll need it for all subsequent requests!

```bash
# Set token as environment variable
export TOKEN="YOUR_TOKEN_HERE"
```

### Step 3: Create a folder

```bash
curl -X POST http://0.0.0.0:5000/files \
  -H "X-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my_photos", "type": "folder"}'
```

**Response:**
```json
{
  "id": "FOLDER_ID",
  "userId": "USER_ID",
  "name": "my_photos",
  "type": "folder",
  "isPublic": false,
  "parentId": 0
}
```

**⚠️ Important:** Save the FOLDER_ID!

```bash
export FOLDER_ID="FOLDER_ID"
```

### Step 4: Upload an image

#### Option A: With Python script (Recommended)

```bash
# Activate virtual environment first
source venv/bin/activate

# Create a test image
echo 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' | base64 -d > test_image.png

# Upload the image
python3 image_upload.py test_image.png $TOKEN $FOLDER_ID
```

#### Option B: With curl

```bash
# Create a test image
echo 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' | base64 -d > test_image.png

# Encode in base64
IMAGE_DATA=$(base64 -w 0 test_image.png)

# Upload
curl -X POST http://0.0.0.0:5000/files \
  -H "X-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"my_photo.png\", \"type\": \"image\", \"isPublic\": true, \"data\": \"$IMAGE_DATA\", \"parentId\": \"$FOLDER_ID\"}"
```

**Response:**
```json
{
  "id": "IMAGE_ID",
  "userId": "USER_ID",
  "name": "my_photo.png",
  "type": "image",
  "isPublic": true,
  "parentId": "FOLDER_ID"
}
```

**⚠️ Important:** Save the IMAGE_ID!

```bash
export IMAGE_ID="IMAGE_ID"
```

### Step 5: Wait for thumbnail generation

```bash
# Wait 5-10 seconds for the worker to generate thumbnails
sleep 5

# Verify thumbnails are created
ls -lh /tmp/files_manager/ | tail -5
```

You should see 4 files:
```
-rw-r--r-- 1 root root  70 Jan 13 13:06 UUID
-rw-r--r-- 1 root root 105 Jan 13 13:06 UUID_500
-rw-r--r-- 1 root root 101 Jan 13 13:06 UUID_250
-rw-r--r-- 1 root root  98 Jan 13 13:06 UUID_100
```

### Step 6: Download files

```bash
# Download original image
curl -XGET http://0.0.0.0:5000/files/$IMAGE_ID/data -o original.png
file original.png

# Download 100px thumbnail
curl -XGET "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=100" -o thumbnail_100.png
file thumbnail_100.png

# Download 250px thumbnail
curl -XGET "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=250" -o thumbnail_250.png
file thumbnail_250.png

# Download 500px thumbnail
curl -XGET "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=500" -o thumbnail_500.png
file thumbnail_500.png

# View all downloaded files
ls -lh original.png thumbnail_*.png
```

**Expected result:**
```
original.png:      PNG image data, 1 x 1, 8-bit/color RGBA, non-interlaced
thumbnail_100.png: PNG image data, 100 x 1, 8-bit/color RGB, non-interlaced
thumbnail_250.png: PNG image data, 250 x 1, 8-bit/color RGB, non-interlaced
thumbnail_500.png: PNG image data, 500 x 1, 8-bit/color RGB, non-interlaced
```

### Step 7: Other operations

```bash
# List all your files
curl -X GET http://0.0.0.0:5000/files -H "X-Token: $TOKEN"

# View a specific file
curl -X GET http://0.0.0.0:5000/files/$IMAGE_ID -H "X-Token: $TOKEN"

# Make a file public
curl -X PUT http://0.0.0.0:5000/files/$IMAGE_ID/publish -H "X-Token: $TOKEN"

# Make a file private
curl -X PUT http://0.0.0.0:5000/files/$IMAGE_ID/unpublish -H "X-Token: $TOKEN"

# Disconnect
curl -X GET http://0.0.0.0:5000/disconnect -H "X-Token: $TOKEN"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create a user |
| GET | `/connect` | Connect (returns a token) |
| GET | `/disconnect` | Disconnect |
| GET | `/users/me` | Get connected user |
| POST | `/files` | Create a file/folder |
| GET | `/files/:id` | Get file information |
| GET | `/files` | List all files |
| PUT | `/files/:id/publish` | Make a file public |
| PUT | `/files/:id/unpublish` | Make a file private |
| GET | `/files/:id/data` | Download a file |
| GET | `/files/:id/data?size=100` | Download 100px thumbnail |
| GET | `/files/:id/data?size=250` | Download 250px thumbnail |
| GET | `/files/:id/data?size=500` | Download 500px thumbnail |

## Project Structure

```
.
├── controllers/
│   ├── AppController.js      # Status, stats
│   ├── AuthController.js     # Authentication
│   ├── FilesController.js    # File management
│   └── UsersController.js    # User management
├── routes/
│   └── index.js              # API routes
├── utils/
│   ├── db.mjs                # MongoDB client
│   └── redis.mjs             # Redis client
├── server.js                 # Express server
├── worker.js                 # Bull worker for thumbnails
├── image_upload.py           # Python upload script
├── venv/                     # Python virtual environment
└── package.json
```

## Environment Variables

You can configure the project with environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=27017
export DB_DATABASE=files_manager
export FOLDER_PATH=/tmp/files_manager
```

## Troubleshooting

### MongoDB won't start

```bash
# Check logs
tail -f /var/log/mongodb/mongod.log

# Create data directory
mkdir -p /data/db
mongod --dbpath /data/db
```

### Redis won't start

```bash
# Check logs
redis-cli
> PING

# Restart Redis
redis-cli shutdown
redis-server &
```

### Thumbnails are not generated

```bash
# Check if worker is running
ps aux | grep worker

# Check worker logs
# Errors will appear in the terminal where you launched npm run start-worker

# Restart worker
# Ctrl+C in the worker terminal
npm run start-worker
```

### "PayloadTooLargeError" error

The server has a size limit for uploads. For large images, you need to increase the limit in `server.js`.

### Python script issues

If `image_upload.py` doesn't work:

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Verify requests module is installed
pip list | grep requests

# If not installed
pip install requests
```

## Authors

Project completed as part of the Holberton School curriculum.

## License

ISC
