# DATABASE SCHEMA

**PostgreSQL Schema for Operis Cloud Server**

Version: 1.0
Date: 2026-01-29
Database: PostgreSQL 14+

---

## 1. OVERVIEW

### 1.1. Database Purpose

Stores:
- Customer accounts
- Mini-PC boxes (device registrations)
- Cronjob schedules
- Command logs
- Agent sessions

### 1.2. Technology

- **Primary:** PostgreSQL 14+
- **Per-Agent:** SQLite (memory/RAG) - unchanged from Moltbot
- **Cache:** Redis (sessions, WebSocket pub/sub)

---

## 2. SCHEMA

### 2.1. Customers Table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  plan TEXT NOT NULL DEFAULT 'starter', -- starter, professional, enterprise
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Billing
  stripe_customer_id TEXT,
  subscription_status TEXT, -- active, canceled, past_due

  -- Limits
  max_boxes INTEGER NOT NULL DEFAULT 1,
  max_agents_per_box INTEGER NOT NULL DEFAULT 5,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_stripe ON customers(stripe_customer_id);
```

### 2.2. Boxes Table

```sql
CREATE TABLE boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Authentication
  api_key_hash TEXT NOT NULL,
  hardware_id TEXT UNIQUE,

  -- Box Info
  name TEXT NOT NULL,
  hostname TEXT,
  os TEXT, -- linux, windows, darwin
  arch TEXT, -- amd64, arm64

  -- Connection Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, online, offline, error
  last_seen_at TIMESTAMP,
  last_ip TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_boxes_customer_id ON boxes(customer_id);
CREATE INDEX idx_boxes_status ON boxes(status);
CREATE INDEX idx_boxes_last_seen ON boxes(last_seen_at);
CREATE INDEX idx_boxes_hardware_id ON boxes(hardware_id);
```

### 2.3. Agents Table

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Agent Config
  name TEXT NOT NULL,
  model TEXT NOT NULL, -- claude-sonnet-4.5, gpt-4, etc.
  system_prompt TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, error
  last_active_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agents_box_id ON agents(box_id);
CREATE INDEX idx_agents_customer_id ON agents(customer_id);
CREATE INDEX idx_agents_status ON agents(status);
```

### 2.4. Cronjobs Table

```sql
CREATE TABLE cronjobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Job Config
  name TEXT NOT NULL,
  schedule TEXT NOT NULL, -- cron expression: "0 9 * * *"
  action TEXT NOT NULL, -- create_agent_with_task, run_bash_command, etc.
  task TEXT, -- task description or command

  -- Status
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_cronjobs_box_id ON cronjobs(box_id);
CREATE INDEX idx_cronjobs_customer_id ON cronjobs(customer_id);
CREATE INDEX idx_cronjobs_enabled ON cronjobs(enabled);
CREATE INDEX idx_cronjobs_next_run ON cronjobs(next_run_at);
```

### 2.5. Cronjob Executions Table

```sql
CREATE TABLE cronjob_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cronjob_id UUID NOT NULL REFERENCES cronjobs(id) ON DELETE CASCADE,

  -- Execution Details
  status TEXT NOT NULL, -- success, failure
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP,
  duration_ms INTEGER,

  -- Results
  output TEXT,
  error TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_cronjob_executions_cronjob_id ON cronjob_executions(cronjob_id);
CREATE INDEX idx_cronjob_executions_started_at ON cronjob_executions(started_at);
```

### 2.6. Commands Log Table

```sql
CREATE TABLE commands_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

  -- Command Details
  command_id TEXT NOT NULL, -- from protocol
  command_type TEXT NOT NULL, -- bash.exec, browser.navigate, etc.
  command_payload JSONB,

  -- Result
  success BOOLEAN,
  response_payload JSONB,
  error TEXT,

  -- Timing
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  received_at TIMESTAMP,
  duration_ms INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_commands_log_box_id ON commands_log(box_id);
CREATE INDEX idx_commands_log_agent_id ON commands_log(agent_id);
CREATE INDEX idx_commands_log_sent_at ON commands_log(sent_at);
CREATE INDEX idx_commands_log_command_type ON commands_log(command_type);

-- Partition by month for performance
CREATE TABLE commands_log_y2026m01 PARTITION OF commands_log
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### 2.7. Sessions Table (Redis Alternative)

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Session Data
  data JSONB NOT NULL,

  -- Expiry
  expires_at TIMESTAMP NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_customer_id ON sessions(customer_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Auto-delete expired sessions
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run every hour
-- (Setup with pg_cron or external cron)
```

---

## 3. INDEXES & PERFORMANCE

### 3.1. Composite Indexes

```sql
-- Frequently queried together
CREATE INDEX idx_boxes_customer_status ON boxes(customer_id, status);
CREATE INDEX idx_agents_box_status ON agents(box_id, status);
CREATE INDEX idx_cronjobs_enabled_next_run ON cronjobs(enabled, next_run_at) WHERE enabled = true;
```

### 3.2. Partial Indexes

```sql
-- Only index active entities
CREATE INDEX idx_boxes_online ON boxes(customer_id) WHERE status = 'online';
CREATE INDEX idx_agents_active ON agents(box_id) WHERE status = 'active';
```

---

## 4. CONSTRAINTS

### 4.1. Check Constraints

```sql
-- Ensure valid cron expressions
ALTER TABLE cronjobs ADD CONSTRAINT check_valid_cron
  CHECK (schedule ~ '^(\*|[0-9,\-/]+) (\*|[0-9,\-/]+) (\*|[0-9,\-/]+) (\*|[0-9,\-/]+) (\*|[0-9,\-/]+)$');

-- Ensure valid status values
ALTER TABLE boxes ADD CONSTRAINT check_box_status
  CHECK (status IN ('pending', 'online', 'offline', 'error'));

ALTER TABLE agents ADD CONSTRAINT check_agent_status
  CHECK (status IN ('active', 'paused', 'error'));

-- Ensure positive durations
ALTER TABLE cronjob_executions ADD CONSTRAINT check_positive_duration
  CHECK (duration_ms IS NULL OR duration_ms >= 0);
```

---

## 5. TRIGGERS

### 5.1. Update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_boxes_updated_at BEFORE UPDATE ON boxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cronjobs_updated_at BEFORE UPDATE ON cronjobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 5.2. Calculate Next Run Time

```sql
CREATE OR REPLACE FUNCTION calculate_next_run()
RETURNS TRIGGER AS $$
BEGIN
  -- Use external cron library to calculate next run
  -- This is a placeholder - implement with actual cron parser
  NEW.next_run_at = NOW() + INTERVAL '1 day';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_cronjob_next_run BEFORE INSERT OR UPDATE ON cronjobs
  FOR EACH ROW EXECUTE FUNCTION calculate_next_run();
```

---

## 6. SEED DATA

```sql
-- Insert default admin customer
INSERT INTO customers (email, password_hash, name, plan, max_boxes)
VALUES (
  'admin@operis.com',
  '$2b$10$...',  -- bcrypt hash
  'Admin User',
  'enterprise',
  100
);

-- Insert example box
INSERT INTO boxes (customer_id, name, api_key_hash, status)
SELECT
  id,
  'Development Box',
  encode(sha256('development-api-key'::bytea), 'hex'),
  'pending'
FROM customers WHERE email = 'admin@operis.com';
```

---

## 7. MIGRATIONS

### 7.1. Migration Tool

Use **node-pg-migrate** or **Prisma Migrate**:

```bash
npm install node-pg-migrate
```

**migrations/001_initial_schema.sql:**

```sql
-- (All CREATE TABLE statements above)
```

**migrations/002_add_metadata_columns.sql:**

```sql
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

### 7.2. Running Migrations

```bash
# Apply migrations
npm run migrate up

# Rollback last migration
npm run migrate down
```

---

## 8. BACKUP STRATEGY

### 8.1. PostgreSQL Backups

```bash
# Daily full backup
pg_dump operis_prod > backups/operis_$(date +%Y%m%d).sql

# Continuous WAL archiving for point-in-time recovery
archive_command = 'cp %p /backups/wal/%f'
```

### 8.2. Retention Policy

- **Full backups:** Daily, keep 30 days
- **WAL archives:** Keep 7 days
- **Commands log:** Partition by month, keep 3 months

---

## 9. QUERIES

### 9.1. Common Queries

**Get customer's boxes:**

```sql
SELECT * FROM boxes
WHERE customer_id = $1
ORDER BY created_at DESC;
```

**Get active agents for a box:**

```sql
SELECT * FROM agents
WHERE box_id = $1 AND status = 'active'
ORDER BY created_at DESC;
```

**Get enabled cronjobs ready to run:**

```sql
SELECT * FROM cronjobs
WHERE enabled = true
  AND next_run_at <= NOW()
ORDER BY next_run_at ASC;
```

**Get recent commands for a box:**

```sql
SELECT *
FROM commands_log
WHERE box_id = $1
  AND sent_at >= NOW() - INTERVAL '1 hour'
ORDER BY sent_at DESC
LIMIT 100;
```

---

## 10. SUMMARY

**Tables:** 7 core tables
- customers
- boxes
- agents
- cronjobs
- cronjob_executions
- commands_log
- sessions

**Features:**
✅ Multi-tenancy (customers → boxes)
✅ Authentication (API keys, hardware ID)
✅ Cronjob scheduling
✅ Command logging
✅ Session management
✅ Automatic timestamps
✅ Constraints & validation
✅ Indexes for performance

**Next:** See [04-relay-gateway-spec.md](04-relay-gateway-spec.md) for database integration.

---

**Document Version:** 1.0
**Date:** 2026-01-29
**Status:** Complete - Ready for implementation
