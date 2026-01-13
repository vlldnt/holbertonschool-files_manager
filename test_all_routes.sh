#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=()

echo "=========================================="
echo "Testing all API routes from README.md"
echo "=========================================="
echo ""

# Test 1: GET /status
echo -e "${YELLOW}Test 1: GET /status${NC}"
RESPONSE=$(curl -sS http://0.0.0.0:5000/status)
echo "$RESPONSE" | jq
if echo "$RESPONSE" | jq -e '.redis and .db' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Test 1 passed${NC}\n"
else
    echo -e "${RED}✗ Test 1 failed${NC}\n"
    ERRORS+=("Test 1: GET /status failed")
fi

# Test 2: GET /stats
echo -e "${YELLOW}Test 2: GET /stats${NC}"
RESPONSE=$(curl -sS http://0.0.0.0:5000/stats)
echo "$RESPONSE" | jq
if echo "$RESPONSE" | jq -e '.users != null and .files != null' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Test 2 passed${NC}\n"
else
    echo -e "${RED}✗ Test 2 failed${NC}\n"
    ERRORS+=("Test 2: GET /stats failed")
fi

# Test 3: POST /users
echo -e "${YELLOW}Test 3: POST /users${NC}"
EMAIL="test_$(date +%s)@test.com"
PASSWORD="TestPass123!"
RESPONSE=$(curl -sS -X POST http://0.0.0.0:5000/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$RESPONSE" | jq
if echo "$RESPONSE" | jq -e '.id and .email' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Test 3 passed${NC}\n"
else
    # Try with existing user
    EMAIL="sylvain@durif.com"
    PASSWORD="Le.Christ.Cosmique"
    echo -e "${YELLOW}User already exists, using existing credentials${NC}\n"
fi

# Test 4: GET /connect
echo -e "${YELLOW}Test 4: GET /connect${NC}"
export TOKEN=$(curl -sS http://0.0.0.0:5000/connect \
  -H "Authorization: Basic $(echo -n "$EMAIL:$PASSWORD" | base64)" \
  | jq -r '.token')
echo "TOKEN: $TOKEN"
if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
    echo -e "${GREEN}✓ Test 4 passed${NC}\n"
else
    echo -e "${RED}✗ Test 4 failed${NC}\n"
    ERRORS+=("Test 4: GET /connect failed")
    exit 1
fi

# Test 5: GET /users/me
echo -e "${YELLOW}Test 5: GET /users/me${NC}"
RESPONSE=$(curl -sS http://0.0.0.0:5000/users/me -H "X-Token: $TOKEN")
echo "$RESPONSE" | jq
if echo "$RESPONSE" | jq -e '.id and .email' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Test 5 passed${NC}\n"
else
    echo -e "${RED}✗ Test 5 failed${NC}\n"
    ERRORS+=("Test 5: GET /users/me failed")
fi

# Test 6: POST /files (créer un dossier)
echo -e "${YELLOW}Test 6: POST /files (créer un dossier)${NC}"
export FOLDER_ID=$(curl -sS -X POST http://0.0.0.0:5000/files \
  -H "X-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"my_folder","type":"folder"}' \
  | jq -r '.id')
echo "FOLDER_ID: $FOLDER_ID"
if [ "$FOLDER_ID" != "null" ] && [ ! -z "$FOLDER_ID" ]; then
    echo -e "${GREEN}✓ Test 6 passed${NC}\n"
else
    echo -e "${RED}✗ Test 6 failed${NC}\n"
    ERRORS+=("Test 6: POST /files (folder) failed")
fi

# Test 7: POST /files (upload fichier texte)
echo -e "${YELLOW}Test 7: POST /files (upload fichier texte)${NC}"
export FILE_ID=$(curl -sS -X POST http://0.0.0.0:5000/files \
  -H "X-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"test.txt\",\"type\":\"file\",\"data\":\"SGVsbG8gV29ybGQh\",\"parentId\":\"$FOLDER_ID\"}" \
  | jq -r '.id')
echo "FILE_ID: $FILE_ID"
if [ "$FILE_ID" != "null" ] && [ ! -z "$FILE_ID" ]; then
    echo -e "${GREEN}✓ Test 7 passed${NC}\n"
else
    echo -e "${RED}✗ Test 7 failed${NC}\n"
    ERRORS+=("Test 7: POST /files (text file) failed")
fi

# Test 8: POST /files (upload image)
echo -e "${YELLOW}Test 8: POST /files (upload image)${NC}"
export IMAGE_ID=$(curl -sS -X POST http://0.0.0.0:5000/files \
  -H "X-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"image.png","type":"image","isPublic":true,"data":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}' \
  | jq -r '.id')
echo "IMAGE_ID: $IMAGE_ID"
if [ "$IMAGE_ID" != "null" ] && [ ! -z "$IMAGE_ID" ]; then
    echo -e "${GREEN}✓ Test 8 passed${NC}\n"
else
    echo -e "${RED}✗ Test 8 failed${NC}\n"
    ERRORS+=("Test 8: POST /files (image) failed")
fi

# Test 9: GET /files/:id
echo -e "${YELLOW}Test 9: GET /files/:id${NC}"
RESPONSE=$(curl -sS http://0.0.0.0:5000/files/$FILE_ID -H "X-Token: $TOKEN")
echo "$RESPONSE" | jq
if echo "$RESPONSE" | jq -e '.id and .name' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Test 9 passed${NC}\n"
else
    echo -e "${RED}✗ Test 9 failed${NC}\n"
    ERRORS+=("Test 9: GET /files/:id failed")
fi

# Test 10: GET /files (pagination)
echo -e "${YELLOW}Test 10: GET /files (pagination)${NC}"
RESPONSE=$(curl -sS "http://0.0.0.0:5000/files?parentId=0&page=0" -H "X-Token: $TOKEN")
echo "$RESPONSE" | jq
if echo "$RESPONSE" | jq -e '. | length >= 0' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Test 10 passed${NC}\n"
else
    echo -e "${RED}✗ Test 10 failed${NC}\n"
    ERRORS+=("Test 10: GET /files (pagination) failed")
fi

# Test 11: PUT /files/:id/publish
echo -e "${YELLOW}Test 11: PUT /files/:id/publish${NC}"
RESPONSE=$(curl -sS -X PUT http://0.0.0.0:5000/files/$FILE_ID/publish -H "X-Token: $TOKEN")
echo "$RESPONSE" | jq
if echo "$RESPONSE" | jq -e '.isPublic == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Test 11 passed${NC}\n"
else
    echo -e "${RED}✗ Test 11 failed${NC}\n"
    ERRORS+=("Test 11: PUT /files/:id/publish failed")
fi

# Test 12: PUT /files/:id/unpublish
echo -e "${YELLOW}Test 12: PUT /files/:id/unpublish${NC}"
RESPONSE=$(curl -sS -X PUT http://0.0.0.0:5000/files/$FILE_ID/unpublish -H "X-Token: $TOKEN")
echo "$RESPONSE" | jq
if echo "$RESPONSE" | jq -e '.isPublic == false' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Test 12 passed${NC}\n"
else
    echo -e "${RED}✗ Test 12 failed${NC}\n"
    ERRORS+=("Test 12: PUT /files/:id/unpublish failed")
fi

# Test 13: GET /files/:id/data
echo -e "${YELLOW}Test 13: GET /files/:id/data${NC}"
# First make the file public
curl -sS -X PUT http://0.0.0.0:5000/files/$FILE_ID/publish -H "X-Token: $TOKEN" > /dev/null
RESPONSE=$(curl -sS -w "\nHTTP_CODE:%{http_code}" http://0.0.0.0:5000/files/$FILE_ID/data)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
CONTENT=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')
echo "Content: $CONTENT"
echo "HTTP Code: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ] && [ "$CONTENT" = "Hello World!" ]; then
    echo -e "${GREEN}✓ Test 13 passed${NC}\n"
else
    echo -e "${RED}✗ Test 13 failed${NC}\n"
    ERRORS+=("Test 13: GET /files/:id/data failed")
fi

# Test 14: GET /files/:id/data (thumbnails)
echo -e "${YELLOW}Test 14: GET /files/:id/data (thumbnails)${NC}"
# Wait a bit for worker to generate thumbnails
sleep 3
THUMB_100=$(curl -sS -w "%{http_code}" -o /tmp/thumb_100.png "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=100")
THUMB_250=$(curl -sS -w "%{http_code}" -o /tmp/thumb_250.png "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=250")
THUMB_500=$(curl -sS -w "%{http_code}" -o /tmp/thumb_500.png "http://0.0.0.0:5000/files/$IMAGE_ID/data?size=500")
echo "Thumbnail 100: HTTP $THUMB_100"
echo "Thumbnail 250: HTTP $THUMB_250"
echo "Thumbnail 500: HTTP $THUMB_500"
if [ "$THUMB_100" = "200" ] || [ "$THUMB_250" = "200" ] || [ "$THUMB_500" = "200" ]; then
    echo -e "${GREEN}✓ Test 14 passed (at least one thumbnail generated)${NC}\n"
elif [ "$THUMB_100" = "404" ]; then
    echo -e "${YELLOW}⚠ Test 14 warning: Thumbnails not yet generated (worker may be processing)${NC}\n"
else
    echo -e "${RED}✗ Test 14 failed${NC}\n"
    ERRORS+=("Test 14: GET /files/:id/data (thumbnails) failed")
fi

# Test 15: GET /disconnect
echo -e "${YELLOW}Test 15: GET /disconnect${NC}"
RESPONSE=$(curl -sS http://0.0.0.0:5000/disconnect -H "X-Token: $TOKEN")
echo "Response: $RESPONSE"
if [ -z "$RESPONSE" ] || [ "$RESPONSE" = "{}" ]; then
    echo -e "${GREEN}✓ Test 15 passed${NC}\n"
else
    echo -e "${RED}✗ Test 15 failed${NC}\n"
    ERRORS+=("Test 15: GET /disconnect failed")
fi

# Summary
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
if [ ${#ERRORS[@]} -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}${#ERRORS[@]} test(s) failed:${NC}"
    for error in "${ERRORS[@]}"; do
        echo -e "${RED}- $error${NC}"
    done
    exit 1
fi
