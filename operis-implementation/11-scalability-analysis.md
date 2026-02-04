# SCALABILITY ANALYSIS

**Detailed Performance and Resource Analysis**

Version: 1.0
Date: 2026-01-29

---

## 1. RESOURCE REQUIREMENTS

### 1.1. Single Cloud Server (4 vCPU, 8GB RAM)

**Capacity:**

| Metric | Value | Calculation |
|--------|-------|-------------|
| **Concurrent Mini-PCs** | 100-150 | WebSocket connections: ~5-10MB each |
| **Active Agents** | 10-30 | Agent runtime: ~50-100MB each |
| **Commands/sec** | 50-100 | I/O bound, not CPU intensive |
| **Database Connections** | 20-50 | Connection pooling |
| **Memory Usage** | 6-7GB | 1GB buffer for OS |

**Breakdown:**

```
Memory Usage:
├── Node.js Runtime:        1.5GB
├── WebSocket Connections:  1.0GB (100 × 10MB)
├── Active Agents:          2.0GB (20 × 100MB)
├── PostgreSQL Shared:      1.0GB
├── Redis Cache:            0.5GB
├── OS + Buffer:            1.0GB
└── TOTAL:                  7.0GB / 8GB ✅
```

---

## 2. PERFORMANCE CHARACTERISTICS

### 2.1. Latency Breakdown

**Command Execution Time:**

```
Total Time = Cloud Processing + Network RTT + Mini-PC Execution + Network RTT

Example: Bash Command "ls -la"
├── Cloud processing:       5ms    (prepare command)
├── Network RTT (down):     100ms  (cloud → mini-PC)
├── Mini-PC execution:      10ms   (actual ls command)
├── Network RTT (up):       100ms  (mini-PC → cloud)
└── TOTAL:                  215ms

Example: Browser Navigate
├── Cloud processing:       5ms
├── Network RTT (down):     100ms
├── Mini-PC execution:      2000ms (Chromium launch + navigate)
├── Network RTT (up):       150ms  (screenshot upload)
└── TOTAL:                  2255ms
```

**Key Insight:** Most time spent in actual execution, not network!

### 2.2. Throughput

**Commands per Second:**

```
Single mini-PC:
- Sequential commands: ~10/sec (100ms latency)
- Parallel commands: ~50/sec (limited by mini-PC CPU)

100 mini-PCs:
- Theoretical max: 5,000 commands/sec
- Practical max: 1,000 commands/sec (20% utilization)
- Typical load: 100 commands/sec (2% utilization)
```

**Database Queries per Second:**

```
PostgreSQL on 4 vCPU:
- Simple SELECTs: ~10,000/sec
- Complex JOINs: ~1,000/sec
- INSERTs: ~5,000/sec
- Typical load: <100/sec ✅ No bottleneck
```

---

## 3. SCALING STRATEGIES

### 3.1. Vertical Scaling (Single Server)

| Server Size | vCPU | RAM | Capacity | Cost/mo |
|-------------|------|-----|----------|---------|
| **Small** | 2 | 4GB | 50 mini-PCs | $20-40 |
| **Medium** | 4 | 8GB | 100-150 mini-PCs | $40-80 |
| **Large** | 8 | 16GB | 300-500 mini-PCs | $80-160 |
| **XLarge** | 16 | 32GB | 1000+ mini-PCs | $160-320 |

**When to upgrade:**
- CPU > 70% sustained
- Memory > 80% sustained
- WebSocket connections > 80% of max

### 3.2. Horizontal Scaling (Multiple Servers)

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │  (HAProxy/NGINX)│
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
         ┌──────▼──────┐ ┌──▼─────────┐ ┌▼──────────────┐
         │ Cloud Srv 1 │ │Cloud Srv 2 │ │ Cloud Srv 3   │
         │ 100 mini-PCs│ │100 mini-PCs│ │ 100 mini-PCs  │
         └──────┬──────┘ └──┬─────────┘ └┬──────────────┘
                │           │             │
                └───────────┼─────────────┘
                            │
                     ┌──────▼────────┐
                     │  PostgreSQL   │
                     │  (Primary)    │
                     └───────────────┘
```

**Load Balancing Strategy:**

```typescript
// Sticky sessions by boxId
function selectServer(boxId: string, servers: Server[]): Server {
  const hash = hashCode(boxId);
  const index = hash % servers.length;
  return servers[index];
}

// Ensures same mini-PC always connects to same server
// → Maintains WebSocket connection
```

**Database Scaling:**

```
┌─────────────────┐
│  PostgreSQL     │
│  Primary        │
│  (Writes)       │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
┌───▼────┐ ┌──▼─────┐
│Replica 1│ │Replica 2│
│(Reads)  │ │(Reads)  │
└─────────┘ └─────────┘

Read queries: Round-robin replicas
Write queries: Always primary
```

---

## 4. LOAD TESTING

### 4.1. Test Scenarios

**Scenario 1: Normal Load**

```
Users: 100 mini-PCs
Commands: 5 commands/min per mini-PC
Total: 500 commands/min (~8/sec)

Expected:
- CPU: 30-40%
- Memory: 5GB
- Latency: <500ms p95
```

**Scenario 2: Peak Load**

```
Users: 100 mini-PCs
Commands: 30 commands/min per mini-PC
Total: 3000 commands/min (~50/sec)

Expected:
- CPU: 60-70%
- Memory: 6.5GB
- Latency: <1000ms p95
```

**Scenario 3: Burst Load**

```
Users: 100 mini-PCs
Commands: 100 commands simultaneously (cron trigger)

Expected:
- CPU: 90-100% (spike)
- Memory: 7GB (spike)
- Latency: <2000ms p95
- Recovery: <30 seconds
```

### 4.2. Load Testing Tools

```bash
# Install k6
brew install k6

# Test script
cat > load-test.js <<'EOF'
import ws from 'k6/ws';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up to 100 connections
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '1m', target: 0 },    // Ramp down
  ],
};

export default function () {
  const boxId = `box-${__VU}`;
  const url = `wss://cloud.operis.com:8443/relay?boxId=${boxId}&apiKey=test&hwid=test`;

  const response = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      // Send 10 commands
      for (let i = 0; i < 10; i++) {
        socket.send(JSON.stringify({
          type: 'bash.exec',
          command: 'echo test',
        }));
      }
    });

    socket.on('message', (data) => {
      check(data, { 'status is success': (r) => JSON.parse(r).success });
    });

    socket.setTimeout(() => {
      socket.close();
    }, 60000);
  });
}
EOF

# Run test
k6 run load-test.js
```

---

## 5. COST ANALYSIS

### 5.1. Infrastructure Costs (per month)

**100 Customers:**

| Item | Cost | Notes |
|------|------|-------|
| Cloud Server (4 vCPU, 8GB) | $60 | Single server sufficient |
| PostgreSQL | $30 | Managed database |
| Redis | $15 | Managed cache |
| Load Balancer | $20 | HA setup |
| Bandwidth (500GB) | $25 | ~5GB per customer |
| CDN | $5 | Static UI files |
| Monitoring | $20 | Datadog/New Relic |
| **Subtotal** | **$175** | **Base infrastructure** |
| LLM API (avg $50/customer) | $5,000 | Variable by usage |
| **TOTAL** | **$5,175** | ~$51.75 per customer |

**1000 Customers:**

| Item | Cost | Notes |
|------|------|-------|
| Cloud Servers (3×) | $180 | Horizontal scaling |
| PostgreSQL (larger) | $100 | More capacity |
| Redis | $50 | Larger cache |
| Load Balancer | $50 | Multi-region |
| Bandwidth (5TB) | $200 | ~5GB per customer |
| CDN | $20 | More traffic |
| Monitoring | $100 | More metrics |
| **Subtotal** | **$700** | **Base infrastructure** |
| LLM API (avg $50/customer) | $50,000 | Variable by usage |
| **TOTAL** | **$50,700** | ~$50.70 per customer |

**Economy of Scale:** Cost per customer drops as you scale!

### 5.2. Pricing Strategy

**Suggested SaaS Pricing:**

| Plan | Price/mo | Included | Target Margin |
|------|----------|----------|---------------|
| **Starter** | $99 | 1 box, 5 agents | 48% ($51 cost) |
| **Professional** | $299 | 3 boxes, 20 agents | 66% ($100 cost) |
| **Enterprise** | $999 | 10 boxes, unlimited | 75% ($250 cost) |

---

## 6. MONITORING METRICS

### 6.1. Key Performance Indicators

**System Health:**

```
✅ CPU Usage < 70%
✅ Memory Usage < 80%
✅ Disk Usage < 70%
✅ Database Connections < 80% of pool
✅ Command Success Rate > 95%
✅ WebSocket Uptime > 99.9%
```

**Latency Targets:**

```
✅ Command P50 < 500ms
✅ Command P95 < 1500ms
✅ Command P99 < 3000ms
✅ WebSocket RTT < 200ms
```

**Alerts:**

```
🚨 CPU > 80% for 5 minutes
🚨 Memory > 90%
🚨 Command failure rate > 10%
🚨 Mini-PC disconnection rate > 20%
🚨 Database query time P95 > 1s
```

---

## 7. SUMMARY

### 7.1. Capacity Planning

**Single Server (4 vCPU, 8GB RAM):**
- ✅ Handles 100-150 mini-PCs comfortably
- ✅ 10-30 active agents concurrently
- ✅ 50-100 commands/sec throughput
- ✅ $60-80/month infrastructure cost

**Scaling Path:**

```
0-100 customers:    1 server (4 vCPU, 8GB)    → $175/mo
100-500 customers:  3 servers (4 vCPU, 8GB)   → $700/mo
500-2000 customers: 10 servers (8 vCPU, 16GB) → $2,000/mo

Linear scaling, predictable costs ✅
```

### 7.2. Bottlenecks

**Not Bottlenecks:**
- ✅ Network bandwidth (light traffic)
- ✅ Database (simple queries)
- ✅ Redis (just caching)

**Potential Bottlenecks:**
- ⚠️ LLM API rate limits (mitigate with multiple providers)
- ⚠️ Mini-PC CPU (customer hardware varies)
- ⚠️ Concurrent agent execution (limit per customer)

**Mitigation:**
- Rate limiting per customer
- Queue system for commands
- Auto-scaling cloud servers

---

**Document Version:** 1.0
**Date:** 2026-01-29
**Status:** Complete - Ready for capacity planning
