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
- jq (for JSON formatting in tests)
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
# For the 'file' command (file identification) and jq (JSON formatting)
apt-get update && apt-get install -y file jq
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

## Individual cURL Tests

### 1. GET /status
```bash
curl -sS http://0.0.0.0:5000/status  | jq
```


### 2. GET /stats
```bash
curl -sS http://0.0.0.0:5000/stats | jq
```

### 3. POST /users (crée un utilisateur)
```bash
EMAIL="sylvain@durif.com"
PASSWORD="Le.Christ.Cosmique"

curl -sS -X POST 0.0.0.0:5000/users \
  -H "Content-Type: application/json" \
  -d "{ \"email\": \"$EMAIL\", \"password\": \"$PASSWORD\" }" | jq
```


### 4. GET /connect (capture automatiquement le TOKEN)
```bash
export TOKEN=$(curl -sS http://0.0.0.0:5000/connect -H "Authorization: Basic $(echo -n "$EMAIL:$PASSWORD" | base64)" | jq -r '.token') && echo $TOKEN
```

### 5. GET /users/me
```bash
curl -sS http://0.0.0.0:5000/users/me -H "X-Token: $TOKEN" | jq
```

### 6. POST /files (créer un dossier, capture FOLDER_ID)
```bash
export FOLDER_ID=$(curl -sS -X POST http://0.0.0.0:5000/files \
  -H "X-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"my_folder","type":"folder"}' \
  | jq -r '.id')
echo "FOLDER_ID: $FOLDER_ID"
```

### 7. POST /files (upload fichier texte, capture FILE_ID)
```bash
export FILE_ID=$(curl -sS -X POST http://0.0.0.0:5000/files \
  -H "X-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"test.txt\",\"type\":\"file\",\"data\":\"SGVsbG8gV29ybGQh\",\"parentId\":\"$FOLDER_ID\"}" \
  | jq -r '.id')
echo "FILE_ID: $FILE_ID"
```

### 8. POST /files (upload image, capture IMAGE_ID)
```bash
export IMAGE_ID=$(curl -sS -X POST http://0.0.0.0:5000/files \
  -H "X-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"image.png","type":"image","isPublic":true,"data":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}' \
  | jq -r '.id')
echo "IMAGE_ID: $IMAGE_ID"
```

### 9. GET /files/:id
```bash
curl -sS http://0.0.0.0:5000/files/$FILE_ID -H "X-Token: $TOKEN" | jq
```

### 10. GET /files (pagination)
```bash
curl -sS "http://0.0.0.0:5000/files?parentId=0&page=0" -H "X-Token: $TOKEN" | jq
```

### 11. PUT /files/:id/publish
```bash
curl -sS -X PUT http://0.0.0.0:5000/files/$FILE_ID/publish -H "X-Token: $TOKEN" | jq
```

### 12. PUT /files/:id/unpublish
```bash
curl -sS -X PUT http://0.0.0.0:5000/files/$FILE_ID/unpublish -H "X-Token: $TOKEN" | jq
```

### 13. GET /files/:id/data (fichier original)
```bash
curl -sS http://0.0.0.0:5000/files/$FILE_ID/data
```

### 14. GET /files/:id/data (thumbnails pour image)
```bash
curl -sS "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=100" -o thumb_100.png
curl -sS "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=250" -o thumb_250.png
curl -sS "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=500" -o thumb_500.png
```

### 15. GET /disconnect
```bash
curl -sS http://0.0.0.0:5000/disconnect -H "X-Token: $TOKEN"
```