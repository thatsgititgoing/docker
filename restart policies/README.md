# Docker Restart Policies Guide

Comprehensive guide to Docker container restart policies with practical examples and real-world use cases.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Restart Policy Types](#restart-policy-types)
3. [Practical Examples](#practical-examples)
4. [Use Cases](#use-cases)
5. [Setting Restart Policies](#setting-restart-policies)
6. [Monitoring & Management](#monitoring--management)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

**Restart policies** control whether and when Docker automatically restarts containers after they exit or when the Docker daemon starts.

### Why Restart Policies Matter

- ✅ **High Availability**: Automatically restart crashed services
- ✅ **Recovery**: Handle transient failures
- ✅ **System Reboot**: Ensure services start after host restart
- ✅ **Production Reliability**: Keep critical services running

### Default Behavior

**Without a restart policy:**
- Container exits → Stays stopped
- Docker daemon restarts → Container stays stopped
- Manual restart required

**With a restart policy:**
- Container exits → Automatically restarts (based on policy)
- Docker daemon restarts → Container may restart (based on policy)

---

## Restart Policy Types

Docker provides **4 restart policies**:

### 1. `no` (Default)

**No automatic restart.**

**Behavior:**
- Container exits → Stays stopped
- Docker daemon restarts → Container stays stopped
- Must manually restart

**Syntax:**
```bash
docker run --restart=no <image>
# or (default)
docker run <image>
```

**Example:**
```bash
docker run -d --name test-no --restart=no nginx
```

**When to use:**
- ✅ One-time jobs
- ✅ Development/testing
- ✅ Manual control needed
- ✅ CI/CD build containers

---

### 2. `on-failure[:max-retries]`

**Restart only if container exits with non-zero exit code.**

**Behavior:**
- Exit code 0 (success) → Don't restart
- Exit code non-zero (failure) → Restart
- Optional: Limit retry attempts
- Docker daemon restart → Container doesn't automatically start

**Syntax:**
```bash
docker run --restart=on-failure <image>
docker run --restart=on-failure:5 <image>  # Max 5 retries
```

**Example:**
```bash
# Unlimited retries on failure
docker run -d --name app --restart=on-failure myapp

# Maximum 3 retry attempts
docker run -d --name app --restart=on-failure:3 myapp
```

**When to use:**
- ✅ Applications that may fail temporarily
- ✅ Services with transient errors
- ✅ When you want to limit restart attempts
- ✅ Background workers

**Exit codes:**
```bash
# Exit 0 - Success (won't restart)
docker run --restart=on-failure alpine sh -c "exit 0"

# Exit 1 - Failure (will restart)
docker run --restart=on-failure alpine sh -c "exit 1"
```

---

### 3. `always`

**Always restart, regardless of exit status.**

**Behavior:**
- Container exits → Restart
- Any exit code (0 or non-zero) → Restart
- Docker daemon restarts → Container restarts
- Manually stopped → Restart when daemon starts

**Syntax:**
```bash
docker run --restart=always <image>
```

**Example:**
```bash
docker run -d --name web --restart=always nginx
```

**When to use:**
- ✅ Critical production services
- ✅ Long-running services (web servers, databases)
- ✅ Services that should always be running
- ✅ Infrastructure services

**Behavior after stop:**
```bash
# Start with always policy
docker run -d --name web --restart=always nginx

# Manually stop
docker stop web

# Docker daemon restarts → Container WILL restart
sudo systemctl restart docker
# Container "web" is now running again
```

---

### 4. `unless-stopped`

**Always restart UNLESS explicitly stopped by user.**

**Behavior:**
- Container exits → Restart
- Any exit code → Restart
- Docker daemon restarts → Restart (UNLESS manually stopped)
- Manually stopped → Stay stopped even after daemon restart

**Syntax:**
```bash
docker run --restart=unless-stopped <image>
```

**Example:**
```bash
docker run -d --name web --restart=unless-stopped nginx
```

**When to use:**
- ✅ **Most production services** (recommended over `always`)
- ✅ Services that should survive daemon restarts
- ✅ When you want manual stop to persist
- ✅ Respects user intent

**Key difference from `always`:**
```bash
# Start with unless-stopped
docker run -d --name web --restart=unless-stopped nginx

# Manually stop
docker stop web

# Docker daemon restarts → Container STAYS stopped
sudo systemctl restart docker
# Container "web" is still stopped (respects your stop command)
```

---

## Practical Examples

### Example 1: No Restart (One-Time Job)

```bash
# Build job that should run once and stop
docker run --name build-job \
  --restart=no \
  -v $(pwd):/app \
  node:22-alpine \
  npm run build

# After completion, container stays stopped
```

**Use case:** CI/CD builds, data migrations, one-time scripts

---

### Example 2: On-Failure (Retry on Error)

```bash
# API service that might fail on startup (DB not ready)
docker run -d --name api \
  --restart=on-failure:5 \
  -p 8080:8080 \
  api-server

# Will retry up to 5 times if exits with error
# Stops retrying after 5 failures
# Won't restart if exits successfully (exit 0)
```

**Use case:** Services with dependencies, temporary failures

---

### Example 3: Always Restart (Critical Service)

```bash
# Web server that must always run
docker run -d --name nginx \
  --restart=always \
  -p 80:80 \
  -v /var/www:/usr/share/nginx/html \
  nginx:1.27.0

# Restarts automatically:
# - If crashes
# - After manual stop + daemon restart
# - After host reboot (if Docker starts on boot)
```

**Use case:** Web servers, critical infrastructure

---

### Example 4: Unless-Stopped (Recommended Production)

```bash
# Database that should survive daemon restarts
docker run -d --name postgres \
  --restart=unless-stopped \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine

# Restarts automatically:
# - If crashes
# - After daemon restart (unless you stopped it)
#
# Respects manual stops:
# - docker stop postgres → stays stopped after daemon restart
```

**Use case:** Databases, applications, most production services

---

### Example 5: Application Stack

```bash
# Database - unless-stopped
docker run -d --name postgres \
  --restart=unless-stopped \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# Cache - unless-stopped
docker run -d --name redis \
  --restart=unless-stopped \
  -v redis-data:/data \
  redis:7-alpine

# API Server - unless-stopped
docker run -d --name api \
  --restart=unless-stopped \
  -p 8080:8080 \
  --link postgres:db \
  --link redis:cache \
  api-server

# Background Worker - on-failure
docker run -d --name worker \
  --restart=on-failure:3 \
  --link postgres:db \
  background-worker
```

---

### Example 6: Testing Restart Behavior

**Test container that crashes:**
```bash
# Container exits with error after 5 seconds
docker run -d --name crash-test \
  --restart=on-failure:3 \
  alpine sh -c "sleep 5 && exit 1"

# Watch it restart
docker events --filter 'container=crash-test'

# Check restart count
docker inspect crash-test --format='{{.RestartCount}}'
```

**Test successful exit:**
```bash
# Container exits successfully
docker run -d --name success-test \
  --restart=on-failure \
  alpine sh -c "sleep 5 && exit 0"

# Won't restart (exit 0)
docker ps -a
```

---

## Use Cases

### Use Case 1: Web Server (High Availability)

**Requirement:** Web server must always be available

**Solution:**
```bash
docker run -d --name nginx \
  --restart=unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -v /etc/nginx:/etc/nginx:ro \
  -v /var/www:/usr/share/nginx/html:ro \
  nginx:1.27.0
```

**Why `unless-stopped`:**
- Survives crashes
- Survives host reboots
- Respects maintenance windows (manual stop)

---

### Use Case 2: Database (Data Integrity)

**Requirement:** Database should restart on crash, but respect manual stops

**Solution:**
```bash
docker run -d --name postgres \
  --restart=unless-stopped \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine
```

**Why `unless-stopped`:**
- Auto-recovery from crashes
- Manual stop for backups/maintenance
- Doesn't restart after manual stop + daemon restart

---

### Use Case 3: CI/CD Build Job

**Requirement:** Build once, don't restart

**Solution:**
```bash
docker run --name build \
  --restart=no \
  -v $(pwd):/app \
  -w /app \
  node:22-alpine \
  npm run build
```

**Why `no`:**
- One-time execution
- Build completes and stops
- Manual re-run when needed

---

### Use Case 4: Microservice with Retry

**Requirement:** Service should retry on failure (DB connection issues)

**Solution:**
```bash
docker run -d --name api \
  --restart=on-failure:10 \
  -p 8080:8080 \
  --link postgres:db \
  api-server
```

**Why `on-failure:10`:**
- Retries if DB not ready
- Limits retry attempts (prevents infinite loop)
- Won't restart if successful exit

---

### Use Case 5: Background Worker

**Requirement:** Process jobs, restart on failure, limited retries

**Solution:**
```bash
docker run -d --name worker \
  --restart=on-failure:5 \
  --link redis:queue \
  background-worker
```

**Why `on-failure:5`:**
- Retries transient failures
- Limits retries (alerts ops after 5 failures)
- Stops trying if persistently failing

---

### Use Case 6: Development Environment

**Requirement:** Manual control, no auto-restart

**Solution:**
```bash
docker run -d --name dev-env \
  --restart=no \
  -p 3000:3000 \
  -v ./src:/app/src \
  react-app:dev
```

**Why `no`:**
- Developer controls lifecycle
- Intentional stops
- Testing restart behavior

---

## Setting Restart Policies

### At Container Creation

**Single container:**
```bash
docker run -d --restart=unless-stopped <image>
```

**With docker-compose.yml:**
```yaml
version: '3.8'

services:
  web:
    image: nginx
    restart: unless-stopped
    ports:
      - "80:80"

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

  worker:
    image: background-worker
    restart: on-failure:5

volumes:
  pgdata:
```

---

### Update Existing Container

**Change restart policy without recreating:**
```bash
# Update running container
docker update --restart=unless-stopped <container>

# Update multiple containers
docker update --restart=unless-stopped web db cache

# Update all containers
docker update --restart=unless-stopped $(docker ps -q)
```

**Example:**
```bash
# Create with no restart
docker run -d --name web nginx

# Later, update to unless-stopped
docker update --restart=unless-stopped web

# Verify
docker inspect web --format='{{.HostConfig.RestartPolicy.Name}}'
# Output: unless-stopped
```

---

## Monitoring & Management

### Check Restart Policy

**Single container:**
```bash
docker inspect <container> --format='{{.HostConfig.RestartPolicy.Name}}'
```

**All containers:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RestartPolicy}}"
```

**Custom format:**
```bash
docker inspect $(docker ps -q) --format='Name: {{.Name}}, Restart: {{.HostConfig.RestartPolicy.Name}}, MaxRetries: {{.HostConfig.RestartPolicy.MaximumRetryCount}}'
```

---

### Check Restart Count

**How many times has container restarted:**
```bash
docker inspect <container> --format='{{.RestartCount}}'
```

**Example:**
```bash
# Create container that crashes
docker run -d --name crash-test \
  --restart=on-failure \
  alpine sh -c "sleep 2 && exit 1"

# Wait a bit, then check
sleep 10
docker inspect crash-test --format='Restart count: {{.RestartCount}}'
# Output: Restart count: 5
```

---

### Monitor Restart Events

**Watch container events:**
```bash
# All restart events
docker events --filter event=restart

# Specific container
docker events --filter container=<name> --filter event=restart

# All events for a container
docker events --filter container=<name>
```

**Example:**
```bash
# In terminal 1: Watch events
docker events --filter container=web

# In terminal 2: Restart container
docker restart web

# Terminal 1 shows:
# 2025-11-15T10:30:00.000000000Z container restart web ...
```

---

### View Restart History

**Check container logs:**
```bash
docker logs <container>

# With timestamps
docker logs -t <container>

# Last 50 lines
docker logs --tail 50 <container>
```

**Check system logs:**
```bash
# Docker daemon logs
journalctl -u docker

# Filter by container
journalctl -u docker | grep <container-name>
```

---

## Best Practices

### ✅ Do's

**1. Use `unless-stopped` for most production services**
```bash
# Recommended for production
docker run -d --restart=unless-stopped nginx
```

**Why:**
- Survives crashes and reboots
- Respects manual stops
- Best balance of availability and control

---

**2. Use `on-failure` with max retries for services with dependencies**
```bash
# API that depends on database
docker run -d --restart=on-failure:10 api-server
```

**Why:**
- Handles transient failures (DB not ready)
- Limits retry attempts (prevents infinite loops)
- Alerts you after max retries

---

**3. Always set restart policy for production services**
```bash
# ✅ Good
docker run -d --restart=unless-stopped nginx

# ❌ Bad (forgot restart policy)
docker run -d nginx
```

---

**4. Test restart behavior before production**
```bash
# Test crash handling
docker run -d --name test --restart=on-failure:3 \
  alpine sh -c "sleep 5 && exit 1"

# Monitor
watch -n 1 'docker ps -a | grep test'
```

---

**5. Use `no` for one-time jobs**
```bash
# Build jobs, migrations, scripts
docker run --restart=no build-script
```

---

**6. Document restart policies in docker-compose.yml**
```yaml
services:
  web:
    image: nginx
    restart: unless-stopped  # Documented and version controlled
```

---

**7. Monitor restart counts**
```bash
# Alert if restart count > threshold
RESTART_COUNT=$(docker inspect web --format='{{.RestartCount}}')
if [ $RESTART_COUNT -gt 5 ]; then
  echo "WARNING: Container restarted $RESTART_COUNT times"
fi
```

---

### ❌ Don'ts

**1. Don't use `always` unless absolutely necessary**
```bash
# ⚠️ Careful with always
docker run -d --restart=always nginx

# ✅ Better: use unless-stopped
docker run -d --restart=unless-stopped nginx
```

**Why:**
- `always` restarts even after manual stop + daemon restart
- `unless-stopped` respects manual stops
- `unless-stopped` gives you more control

---

**2. Don't use `on-failure` without max retries**
```bash
# ❌ Bad (infinite retries)
docker run -d --restart=on-failure broken-app

# ✅ Good (limited retries)
docker run -d --restart=on-failure:10 broken-app
```

**Why:**
- Infinite retries waste resources
- Max retries alerts you to persistent issues

---

**3. Don't forget restart policies in production**
```bash
# ❌ Bad (no restart policy)
docker run -d -p 80:80 nginx

# ✅ Good
docker run -d -p 80:80 --restart=unless-stopped nginx
```

---

**4. Don't use `always` for development**
```bash
# ❌ Bad (annoying in development)
docker run -d --restart=always dev-env

# ✅ Good (manual control)
docker run -d --restart=no dev-env
```

---

**5. Don't ignore restart count warnings**
```bash
# Check restart count regularly
docker inspect app --format='{{.RestartCount}}'

# If high (>10), investigate:
docker logs app
```

---

## Restart Policy Decision Tree

```
Need container to restart automatically?
│
├─ No (one-time job, development, manual control)
│  └─ Use: --restart=no
│
├─ Yes, but only on failure
│  ├─ Unlimited retries
│  │  └─ Use: --restart=on-failure
│  │
│  └─ Limited retries (recommended)
│     └─ Use: --restart=on-failure:10
│
└─ Yes, always restart
   ├─ Must restart even after manual stop
   │  └─ Use: --restart=always (rare)
   │
   └─ Restart unless manually stopped
      └─ Use: --restart=unless-stopped (recommended for production)
```

---

## Comparison Table

| Policy | Crash Restart | Exit 0 Restart | Daemon Restart | After Manual Stop | Use Case |
|--------|---------------|----------------|----------------|-------------------|----------|
| `no` | ❌ No | ❌ No | ❌ No | ❌ No | Development, one-time jobs |
| `on-failure` | ✅ Yes | ❌ No | ❌ No | ❌ No | Services with retries |
| `on-failure:5` | ✅ Yes (max 5) | ❌ No | ❌ No | ❌ No | Limited retry attempts |
| `always` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Critical infrastructure |
| `unless-stopped` | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | **Most production services** |

---

## Troubleshooting

### Container Keeps Restarting

**Problem:** Container in restart loop

**Diagnosis:**
```bash
# Check restart count
docker inspect <container> --format='{{.RestartCount}}'

# View logs
docker logs <container>

# Check exit code
docker inspect <container> --format='{{.State.ExitCode}}'
```

**Solutions:**

**1. Check application errors:**
```bash
docker logs --tail 100 <container>
```

**2. Limit restart attempts:**
```bash
docker update --restart=on-failure:5 <container>
```

**3. Temporarily disable restart:**
```bash
docker update --restart=no <container>
docker stop <container>

# Debug the issue
# Fix the application
# Re-enable restart
docker update --restart=unless-stopped <container>
docker start <container>
```

---

### Container Won't Restart After Daemon Restart

**Problem:** Expected container to start after daemon restart, but didn't

**Check restart policy:**
```bash
docker inspect <container> --format='{{.HostConfig.RestartPolicy.Name}}'
```

**If `on-failure`:**
- Container only restarts on non-zero exit
- Daemon restart doesn't trigger restart

**If `unless-stopped` and container stopped:**
- Was it manually stopped before daemon restart?
- Check: `docker inspect <container> --format='{{.State.Status}}'`

**Solution:**
```bash
# Change to unless-stopped if needed
docker update --restart=unless-stopped <container>

# Start it
docker start <container>
```

---

### Too Many Restart Attempts

**Problem:** Container restarted 100+ times

**Diagnosis:**
```bash
# Check restart count
docker inspect <container> --format='{{.RestartCount}}'

# Check logs for error pattern
docker logs <container> | tail -50
```

**Solutions:**

**1. Set max retries:**
```bash
docker update --restart=on-failure:10 <container>
```

**2. Fix underlying issue:**
```bash
# Stop container
docker stop <container>

# Debug
docker logs <container>

# Fix application
# Restart with fix
docker start <container>
```

---

### Restart Policy Not Updating

**Problem:** `docker update` not working

**Check:**
```bash
# Verify update
docker inspect <container> --format='{{.HostConfig.RestartPolicy.Name}}'
```

**Solution:**
```bash
# Restart Docker daemon (if needed)
sudo systemctl restart docker

# Or recreate container
docker stop <container>
docker rm <container>
docker run -d --restart=unless-stopped <image>
```

---

## Docker Compose Examples

### Basic Stack

```yaml
version: '3.8'

services:
  web:
    image: nginx:1.27.0
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html

  app:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

  worker:
    build: ./worker
    restart: on-failure:5
    depends_on:
      - db

volumes:
  pgdata:
```

---

### Production Stack with Different Policies

```yaml
version: '3.8'

services:
  # Critical - always running
  nginx:
    image: nginx:1.27.0
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"

  # Application - unless stopped
  api:
    image: api-server
    restart: unless-stopped
    ports:
      - "8080:8080"

  # Database - unless stopped
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  # Cache - unless stopped
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data

  # Background worker - retry on failure
  worker:
    image: background-worker
    restart: on-failure:10
    depends_on:
      - postgres
      - redis

  # Scheduled job - no restart
  cron:
    image: cron-job
    restart: "no"

volumes:
  pgdata:
  redis-data:
```

---

## Quick Reference

```bash
# Restart policies
--restart=no                    # Never restart (default)
--restart=on-failure            # Restart on non-zero exit
--restart=on-failure:5          # Restart on failure, max 5 times
--restart=always                # Always restart
--restart=unless-stopped        # Always restart unless manually stopped

# Set at creation
docker run -d --restart=unless-stopped nginx

# Update existing container
docker update --restart=unless-stopped <container>

# Check restart policy
docker inspect <container> --format='{{.HostConfig.RestartPolicy.Name}}'

# Check restart count
docker inspect <container> --format='{{.RestartCount}}'

# Monitor restarts
docker events --filter event=restart

# Docker Compose
restart: "no"
restart: on-failure
restart: always
restart: unless-stopped
```

---

## Summary

### Recommended Policies

**Production Services:** `unless-stopped`
```bash
docker run -d --restart=unless-stopped nginx
```

**Services with Dependencies:** `on-failure:10`
```bash
docker run -d --restart=on-failure:10 api-server
```

**One-Time Jobs:** `no`
```bash
docker run --restart=no build-job
```

**Critical Infrastructure (rare):** `always`
```bash
docker run -d --restart=always monitoring-agent
```

---

## Additional Resources

- [Docker Restart Policies Documentation](https://docs.docker.com/config/containers/start-containers-automatically/)
- [Docker Compose Restart Policy](https://docs.docker.com/compose/compose-file/compose-file-v3/#restart)
- [Container Lifecycle](https://docs.docker.com/engine/reference/run/#restart-policies---restart)
