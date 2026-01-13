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

Tests individuels - chaque commande capture automatiquement les variables (TOKEN, IDs):

### 1. GET /status
```bash
curl -sS http://0.0.0.0:5000/status  | jq
```
***Should be:*** `{"redis":true,"db":true}`

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
curl http://0.0.0.0:5000/files/$FILE_ID -H "X-Token: $TOKEN"
```

### 10. GET /files (pagination)
```bash
curl "http://0.0.0.0:5000/files?parentId=0&page=0" -H "X-Token: $TOKEN"
```

### 11. PUT /files/:id/publish
```bash
curl -X PUT http://0.0.0.0:5000/files/$FILE_ID/publish -H "X-Token: $TOKEN"
```

### 12. PUT /files/:id/unpublish
```bash
curl -X PUT http://0.0.0.0:5000/files/$FILE_ID/unpublish -H "X-Token: $TOKEN"
```

### 13. GET /files/:id/data (fichier original)
```bash
curl http://0.0.0.0:5000/files/$FILE_ID/data
```

### 14. GET /files/:id/data (thumbnails pour image)
```bash
curl "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=100" -o thumb_100.png
curl "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=250" -o thumb_250.png
curl "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=500" -o thumb_500.png
```

### 15. GET /disconnect
```bash
curl http://0.0.0.0:5000/disconnect -H "X-Token: $TOKEN"
```

### Workflow complet d'exemple

```bash
# 1. Vérifier le status
curl -sS http://0.0.0.0:5000/status | jq

# 2. Créer un utilisateur
curl -sS -X POST http://0.0.0.0:5000/users -H "Content-Type: application/json" -d '{"email":"testeur@test.com","password":"123456mdp!"}' | jq

# 3. Se connecter et récupérer le token
TOKEN=$(curl -sS -X GET http://0.0.0.0:5000/connect -H "Authorization: Basic $(echo -n 'testeur@test.com:123456mdp!' | base64)" | jq -r '.token') && echo "Token: $TOKEN"

# 4. Vérifier l'utilisateur connecté
curl -sS http://0.0.0.0:5000/users/me -H "X-Token: $TOKEN" | jq

# 5. Créer un dossier
FOLDER_ID=$(curl -X POST http://0.0.0.0:5000/files \
  -H "X-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"MyFolder","type":"folder"}' \
  | jq -r '.id')
echo "Folder ID: $FOLDER_ID"

# 6. Upload un fichier dans le dossier
FILE_ID=$(curl -X POST http://0.0.0.0:5000/files \
  -H "X-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"test.txt\",\"type\":\"file\",\"data\":\"$(echo -n 'Hello World!' | base64)\",\"parentId\":\"$FOLDER_ID\"}" \
  | jq -r '.id')
echo "File ID: $FILE_ID"

# 7. Lister les fichiers
curl "http://0.0.0.0:5000/files?parentId=$FOLDER_ID" -H "X-Token: $TOKEN"

# 8. Publier le fichier
curl -X PUT "http://0.0.0.0:5000/files/$FILE_ID/publish" -H "X-Token: $TOKEN"

# 9. Récupérer le contenu
curl "http://0.0.0.0:5000/files/$FILE_ID/data"

# 10. Se déconnecter
curl -X GET http://0.0.0.0:5000/disconnect -H "X-Token: $TOKEN"
```

## Complete Testing Guide

