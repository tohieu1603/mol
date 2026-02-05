#!/bin/bash
# Test Moltbot Gateway Session Persistence
# Usage: ./scripts/test-gateway-session.sh [port] [token]

PORT=${1:-18792}
TOKEN=${2:-"062b504ca89acfab38e7f0318d0d2d1f19a83b03fe9619f1"}
BASE_URL="http://localhost:$PORT"
SESSION_ID="test-session-$(date +%s)"

echo "=== Moltbot Gateway Session Test ==="
echo "Port: $PORT"
echo "Session: $SESSION_ID"
echo ""

# Request 1: Set name
echo ">>> Request 1: Setting name to 'Hieu'"
REQ1=$(cat <<EOF
{"model":"claude-sonnet-4-20250514","user":"$SESSION_ID","messages":[{"role":"user","content":"My name is Hieu, remember it!"}],"stream":false}
EOF
)

RESP1=$(curl -s -X POST "$BASE_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$REQ1")

echo "Response: $(echo "$RESP1" | jq -r '.choices[0].message.content // .error.message' 2>/dev/null || echo "$RESP1")"
echo "Usage: $(echo "$RESP1" | jq '.usage' 2>/dev/null)"
echo ""

# Request 2: Ask name
echo ">>> Request 2: Asking for name"
REQ2=$(cat <<EOF
{"model":"claude-sonnet-4-20250514","user":"$SESSION_ID","messages":[{"role":"user","content":"What is my name?"}],"stream":false}
EOF
)

RESP2=$(curl -s -X POST "$BASE_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$REQ2")

echo "Response: $(echo "$RESP2" | jq -r '.choices[0].message.content // .error.message' 2>/dev/null || echo "$RESP2")"
echo "Usage: $(echo "$RESP2" | jq '.usage' 2>/dev/null)"
echo ""

# Check if name was remembered
if echo "$RESP2" | grep -qi "hieu"; then
  echo "✅ Session PASSED - Name was remembered!"
else
  echo "❌ Session FAILED - Name was NOT remembered"
fi

echo ""
echo "=== Stream Test ==="

# Request 3: Stream test
echo ">>> Request 3: Stream with usage"
REQ3=$(cat <<EOF
{"model":"claude-sonnet-4-20250514","user":"$SESSION_ID","messages":[{"role":"user","content":"Say hello"}],"stream":true,"stream_options":{"include_usage":true}}
EOF
)

echo "Streaming response:"
curl -s -N -X POST "$BASE_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$REQ3" | while read -r line; do
  if [[ "$line" == data:* ]]; then
    data="${line#data: }"
    if [[ "$data" == "[DONE]" ]]; then
      echo "[DONE]"
    else
      content=$(echo "$data" | jq -r '.choices[0].delta.content // empty' 2>/dev/null)
      usage=$(echo "$data" | jq '.usage // empty' 2>/dev/null)
      if [[ -n "$content" ]]; then
        echo -n "$content"
      fi
      if [[ -n "$usage" && "$usage" != "null" ]]; then
        echo ""
        echo "Usage: $usage"
      fi
    fi
  fi
done

echo ""
echo "=== Test Complete ==="
