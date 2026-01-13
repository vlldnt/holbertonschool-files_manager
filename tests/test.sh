# API test suite (one-paste)
set -euo pipefail
BASE="http://0.0.0.0:5000"

echo "1) GET /status"
curl -sS "$BASE/status" | jq .

echo "2) GET /stats"
curl -sS "$BASE/stats" | jq .

echo "3) POST /users  (create test user)"
EMAIL="test_$(date +%s)@example.com"
PASSWORD="Password123!"
USER_RESP=$(curl -sS -X POST "$BASE/users" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$USER_RESP" | jq .
export USER_ID=$(echo "$USER_RESP" | jq -r '.id')
echo "USER_ID=$USER_ID"

echo "4) GET /connect  (retrieve token with created user)"
BASIC=$(printf "%s:%s" "$EMAIL" "$PASSWORD" | base64)
TOKEN=$(curl -sS -X GET "$BASE/connect" -H "Authorization: Basic $BASIC" | jq -r '.token')
export TOKEN
echo "TOKEN set: ${TOKEN:+(hidden)}"

echo "5) GET /users/me"
curl -sS -X GET "$BASE/users/me" -H "X-Token: $TOKEN" | jq .

echo "6) POST /files  (create folder)"
FOLDER_RESP=$(curl -sS -X POST "$BASE/files" -H "X-Token: $TOKEN" -H "Content-Type: application/json" -d '{"name":"test_folder","type":"folder"}')
echo "$FOLDER_RESP" | jq .
export FOLDER_ID=$(echo "$FOLDER_RESP" | jq -r '.id')
echo "FOLDER_ID=$FOLDER_ID"

echo "7) POST /files  (upload image)"
# create 1x1 PNG
echo 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' | base64 -d > /tmp/test_image.png
IMAGE_DATA=$(base64 -w 0 /tmp/test_image.png)
IMAGE_RESP=$(curl -sS -X POST "$BASE/files" -H "X-Token: $TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"test_image.png\",\"type\":\"image\",\"isPublic\":false,\"data\":\"$IMAGE_DATA\",\"parentId\":\"$FOLDER_ID\"}")
echo "$IMAGE_RESP" | jq .
export IMAGE_ID=$(echo "$IMAGE_RESP" | jq -r '.id')
echo "IMAGE_ID=$IMAGE_ID"

echo "8) GET /files/:id"
curl -sS -X GET "$BASE/files/$IMAGE_ID" -H "X-Token: $TOKEN" | jq .

echo "9) GET /files  (pagination)"
# create a couple of files if needed, then list with pagination
curl -sS -X GET "$BASE/files?page=1&limit=2" -H "X-Token: $TOKEN" | jq .

echo "10) PUT /files/:id/publish"
curl -sS -X PUT "$BASE/files/$IMAGE_ID/publish" -H "X-Token: $TOKEN" | jq .
echo "11) PUT /files/:id/unpublish"
curl -sS -X PUT "$BASE/files/$IMAGE_ID/unpublish" -H "X-Token: $TOKEN" | jq .

echo "12) GET /files/:id/data (original)"
curl -sS -X GET "$BASE/files/$IMAGE_ID/data" -H "X-Token: $TOKEN" -o /tmp/original.png
file /tmp/original.png || true
echo "saved /tmp/original.png"

echo "13) GET /files/:id/data?size=100 (thumbnail 100)"
curl -sS -X GET "$BASE/files/$IMAGE_ID/data?size=100" -H "X-Token: $TOKEN" -o /tmp/thumb_100.png
file /tmp/thumb_100.png || true
echo "saved /tmp/thumb_100.png"

echo "14) GET /disconnect"
curl -sS -X GET "$BASE/disconnect" -H "X-Token: $TOKEN" | jq .

echo "All tests completed."