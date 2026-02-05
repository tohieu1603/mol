#!/bin/bash
# Test Moltbot Gateway /hooks/agent endpoint
# Usage: ./scripts/test-gateway-hooks-agent.sh [port] [hooks_token]

PORT=${1:-18792}
HOOKS_TOKEN=${2:-"062b504ca89acfab38e7f0318d0d2d1f19a83b03fe9619f1"}
BASE_URL="http://localhost:$PORT"

echo "=== Moltbot Gateway Hooks Agent Test ==="
echo "Port: $PORT"
echo "Hooks Token: ${HOOKS_TOKEN:0:10}..."
echo ""

# Test 1: Simple agent message
echo ">>> Test 1: Send simple agent message"
curl -s -X POST "$BASE_URL/hooks/agent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOOKS_TOKEN" \
  -d '{
    "message": "Say hello in Vietnamese",
    "name": "TestCron",
    "wakeMode": "now",
    "sessionKey": "test-cron-001"
  }' | jq .

echo ""

# Test 2: Agent with model and timeout
echo ">>> Test 2: Agent with model and timeout"
curl -s -X POST "$BASE_URL/hooks/agent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOOKS_TOKEN" \
  -d '{
    "message": "What time is it?",
    "name": "TimeCron",
    "wakeMode": "now",
    "sessionKey": "test-cron-002",
    "model": "claude-sonnet-4-20250514",
    "timeoutSeconds": 30
  }' | jq .

echo ""
echo "=== Test Complete ==="
echo ""
echo "Note: The hook returns immediately with runId."
echo "The actual execution happens asynchronously."
