# DEPLOYMENT GUIDE

**Step-by-Step Deployment for Operis**

Version: 1.0
Date: 2026-01-29

---

## 1. CLOUD SERVER DEPLOYMENT

### 1.1. Prerequisites

```bash
# Server Requirements
- Ubuntu 22.04 LTS or Debian 12
- 4 vCPU, 8GB RAM minimum
- 50GB SSD storage
- Public IP address
- Domain name (e.g., cloud.operis.com)
```

### 1.2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16

# Install Redis
sudo apt install -y redis-server

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sudo sh
sudo apt install -y docker-compose

# Install Caddy (reverse proxy)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

### 1.3. Setup PostgreSQL

```bash
# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE operis_prod;
CREATE USER operis WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE operis_prod TO operis;
\c operis_prod
GRANT ALL ON SCHEMA public TO operis;
EOF

# Configure PostgreSQL for production
sudo nano /etc/postgresql/16/main/postgresql.conf
# Set: max_connections = 100
# Set: shared_buffers = 2GB
# Set: effective_cache_size = 6GB
# Set: maintenance_work_mem = 512MB
# Set: checkpoint_completion_target = 0.9

sudo systemctl restart postgresql
```

### 1.4. Clone & Setup Project

```bash
# Create app directory
sudo mkdir -p /opt/operis
sudo chown $USER:$USER /opt/operis
cd /opt/operis

# Clone repository
git clone git@github.com:yourcompany/operis.git .

# Install dependencies
npm install --production

# Build project
npm run build

# Setup environment
cp .env.example .env.production
nano .env.production
```

**`.env.production`:**

```bash
NODE_ENV=production

# Database
DATABASE_URL=postgresql://operis:secure_password_here@localhost:5432/operis_prod

# Redis
REDIS_URL=redis://localhost:6379

# Relay Gateway
RELAY_GATEWAY_PORT=8443
RELAY_GATEWAY_PING_INTERVAL=30000
RELAY_GATEWAY_TIMEOUT=60000

# Web UI Backend
WEB_UI_PORT=3000

# LLM APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Security
JWT_SECRET=generate_random_64_char_string_here
API_KEY_SALT=generate_random_32_char_string_here

# Domain
DOMAIN=cloud.operis.com
```

### 1.5. Run Database Migrations

```bash
npm run migrate up
```

### 1.6. Setup Systemd Service

**`/etc/systemd/system/operis.service`:**

```ini
[Unit]
Description=Operis Cloud Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=operis
WorkingDirectory=/opt/operis
ExecStart=/usr/bin/node /opt/operis/dist/index.js
Restart=always
RestartSec=10

# Environment
Environment=NODE_ENV=production
EnvironmentFile=/opt/operis/.env.production

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=operis

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**Enable and start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable operis
sudo systemctl start operis
sudo systemctl status operis
```

### 1.7. Configure Caddy (Reverse Proxy)

**`/etc/caddy/Caddyfile`:**

```
cloud.operis.com {
  # Web UI Backend (HTTPS)
  reverse_proxy localhost:3000

  # Additional security headers
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "no-referrer-when-downgrade"
  }
}

cloud.operis.com:8443 {
  # Relay Gateway (WebSocket)
  reverse_proxy localhost:8443 {
    header_up Host {host}
    header_up X-Real-IP {remote}
    header_up X-Forwarded-For {remote}
    header_up X-Forwarded-Proto {scheme}
  }
}
```

**Reload Caddy:**

```bash
sudo systemctl reload caddy
```

### 1.8. Verify Deployment

```bash
# Check service status
sudo systemctl status operis

# Check logs
sudo journalctl -u operis -f

# Test HTTPS
curl https://cloud.operis.com/health

# Test WebSocket
wscat -c wss://cloud.operis.com:8443/relay?boxId=test&apiKey=test&hwid=test
```

---

## 2. MINI-PC DEPLOYMENT

### 2.1. Installation Script

Create `install.sh` for customers:

```bash
#!/bin/bash
set -e

echo "====================================="
echo "  Operis Relay Agent Installer"
echo "====================================="

# Check root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo)"
  exit 1
fi

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  aarch64) ARCH="arm64" ;;
esac

BINARY="operis-relay-agent-${OS}-${ARCH}"
VERSION="latest"

echo "Detected: ${OS}-${ARCH}"

# Download binary
echo "Downloading relay agent..."
curl -L "https://releases.operis.com/relay-agent/${VERSION}/${BINARY}" -o /tmp/operis-relay-agent
chmod +x /tmp/operis-relay-agent

# Verify checksum
echo "Verifying checksum..."
curl -L "https://releases.operis.com/relay-agent/${VERSION}/${BINARY}.sha256" -o /tmp/checksum
cd /tmp && sha256sum -c checksum

# Install binary
echo "Installing..."
mv /tmp/operis-relay-agent /usr/local/bin/operis-relay-agent

# Create user
useradd -r -s /bin/false operis || true

# Create directories
mkdir -p /etc/operis
mkdir -p /var/lib/operis
mkdir -p /var/log/operis
chown -R operis:operis /var/lib/operis /var/log/operis

# Prompt for credentials
read -p "Enter Box ID: " BOX_ID
read -sp "Enter API Key: " API_KEY
echo

# Generate config
cat > /etc/operis/config.json <<EOF
{
  "box_id": "${BOX_ID}",
  "api_key": "${API_KEY}",
  "cloud_endpoint": "wss://cloud.operis.com:8443/relay",
  "ui_port": 18789,
  "log_level": "info"
}
EOF

chmod 600 /etc/operis/config.json
chown operis:operis /etc/operis/config.json

# Install systemd service
echo "Installing systemd service..."
cat > /etc/systemd/system/operis-relay-agent.service <<'EOF'
[Unit]
Description=Operis Relay Agent
After=network.target

[Service]
Type=simple
User=operis
Group=operis
ExecStart=/usr/local/bin/operis-relay-agent --config /etc/operis/config.json
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable operis-relay-agent
systemctl start operis-relay-agent

echo ""
echo "====================================="
echo "  Installation Complete!"
echo "====================================="
echo ""
echo "Service Status:"
systemctl status operis-relay-agent --no-pager
echo ""
echo "Web UI: http://localhost:18789"
echo ""
echo "Commands:"
echo "  sudo systemctl status operis-relay-agent"
echo "  sudo journalctl -u operis-relay-agent -f"
```

### 2.2. Customer Usage

```bash
# On customer's mini-PC
curl -sSL https://install.operis.com | sudo bash

# Enter Box ID and API Key when prompted
# (You provide these after creating box in admin panel)
```

---

## 3. DOCKER DEPLOYMENT

### 3.1. Docker Compose

**`docker-compose.yml`:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: operis_prod
      POSTGRES_USER: operis
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  operis:
    build: .
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"
      - "8443:8443"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://operis:${DB_PASSWORD}@postgres:5432/operis_prod
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    volumes:
      - ./data:/app/data
    restart: always

volumes:
  postgres_data:
```

**Deploy:**

```bash
docker-compose up -d
```

---

## 4. MONITORING

### 4.1. Health Checks

```bash
# Endpoint
curl https://cloud.operis.com/health

# Response
{
  "status": "healthy",
  "timestamp": 1706543210,
  "services": {
    "database": "ok",
    "redis": "ok",
    "relay_gateway": "ok"
  },
  "connected_boxes": 42
}
```

### 4.2. Logs

```bash
# Application logs
sudo journalctl -u operis -f

# Relay agent logs (on mini-PC)
sudo journalctl -u operis-relay-agent -f

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## 5. MAINTENANCE

### 5.1. Updates

**Cloud Server:**

```bash
cd /opt/operis
git pull origin main
npm install --production
npm run build
sudo systemctl restart operis
```

**Mini-PC (customer):**

```bash
curl -sSL https://update.operis.com | sudo bash
```

### 5.2. Backup

```bash
# Database
pg_dump operis_prod > backup_$(date +%Y%m%d).sql

# Restore
psql operis_prod < backup_20260129.sql
```

---

## 6. TROUBLESHOOTING

### 6.1. Service Won't Start

```bash
# Check logs
sudo journalctl -u operis -n 100

# Common issues:
- Database connection failed → Check DATABASE_URL
- Port already in use → Check if another process uses 3000/8443
- Permission denied → Check file ownership
```

### 6.2. Mini-PC Can't Connect

```bash
# On mini-PC
sudo journalctl -u operis-relay-agent -f

# Common issues:
- Authentication failed → Verify Box ID and API Key
- Connection refused → Check firewall, ensure cloud server is accessible
- Hardware ID mismatch → Re-register box
```

---

## 7. SUMMARY

✅ **Cloud Deployed:** https://cloud.operis.com
✅ **Relay Gateway:** wss://cloud.operis.com:8443
✅ **Mini-PC Install:** curl -sSL https://install.operis.com | sudo bash
✅ **Monitoring:** /health endpoint + systemd logs
✅ **Backups:** Automated PostgreSQL backups

**Next:** Monitor production, optimize performance.

---

**Document Version:** 1.0
**Date:** 2026-01-29
**Status:** Complete - Ready for deployment
