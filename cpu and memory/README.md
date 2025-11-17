# Docker CPU Resource Management Guide

Complete guide to managing CPU resources for Docker containers with practical examples and use cases.

## 📚 Table of Contents

1. [Overview](#overview)
2. [CPU Limit Options](#cpu-limit-options)
3. [Practical Examples](#practical-examples)
4. [Use Cases](#use-cases)
5. [Monitoring CPU Usage](#monitoring-cpu-usage)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

By default, Docker containers have **unlimited access** to the host's CPU resources. This can lead to:
- One container consuming all CPU
- Resource starvation for other containers
- Unpredictable performance
- System instability

**Solution:** Use Docker's CPU resource management flags to limit and control CPU usage.

---

## CPU Limit Options

Docker provides several flags to control CPU resources:

### 1. `--cpus` (Recommended - Simple)

**Most common and easiest to use.**

**Syntax:**
```bash
docker run --cpus="<value>" <image>
```

**Description:** Limits the container to a specific number of CPUs.

**Values:**
- `1.0` = 1 full CPU core
- `0.5` = Half a CPU core (50%)
- `2.0` = 2 full CPU cores
- `0.25` = Quarter of a CPU (25%)

**Example:**
```bash
# Limit to 1.5 CPUs
docker run --cpus="1.5" nginx

# Limit to 50% of one CPU
docker run --cpus="0.5" nginx
```

**When to use:**
- ✅ Most use cases
- ✅ Simple quota management
- ✅ Multi-tenant environments
- ✅ Resource guarantees

---

### 2. `--cpu-shares` (Relative Weight)

**Controls CPU priority when resources are constrained.**

**Syntax:**
```bash
docker run --cpu-shares=<value> <image>
```

**Description:** Sets the relative CPU weight (priority) compared to other containers.

**Default value:** 1024

**How it works:**
- Container A: `--cpu-shares=1024` (50% priority)
- Container B: `--cpu-shares=1024` (50% priority)
- Container C: `--cpu-shares=2048` (gets 2x more CPU than A or B)

**Example:**
```bash
# High priority container (twice the default)
docker run --cpu-shares=2048 --name high-priority nginx

# Low priority container (half the default)
docker run --cpu-shares=512 --name low-priority nginx
```

**Important:**
- Only matters when CPU is constrained
- If CPU is idle, containers can use more than their share
- Relative, not absolute limits

**When to use:**
- ✅ Priority-based scheduling
- ✅ Background vs foreground tasks
- ✅ When CPU isn't always saturated

---

### 3. `--cpuset-cpus` (CPU Pinning)

**Pins container to specific CPU cores.**

**Syntax:**
```bash
docker run --cpuset-cpus="<cores>" <image>
```

**Description:** Restricts container to run only on specified CPU cores.

**Values:**
- `0` = CPU core 0
- `0,1` = CPU cores 0 and 1
- `0-3` = CPU cores 0, 1, 2, and 3
- `0,2-4` = CPU cores 0, 2, 3, and 4

**Example:**
```bash
# Run on CPU cores 0 and 1 only
docker run --cpuset-cpus="0,1" nginx

# Run on cores 2, 3, 4, 5
docker run --cpuset-cpus="2-5" nginx

# Run on specific cores (0, 2, 4)
docker run --cpuset-cpus="0,2,4" nginx
```

**Check your CPU cores:**
```bash
# Number of CPU cores
nproc

# Detailed CPU info
lscpu
```

**When to use:**
- ✅ NUMA optimization
- ✅ CPU cache locality
- ✅ Isolating workloads
- ✅ Performance-critical applications
- ✅ Real-time applications

---

### 4. `--cpu-period` and `--cpu-quota` (Advanced Control)

**Fine-grained CPU time allocation using CFS (Completely Fair Scheduler).**

**Syntax:**
```bash
docker run --cpu-period=<microseconds> --cpu-quota=<microseconds> <image>
```

**Description:**
- `--cpu-period`: Length of CPU scheduling period (default: 100000 = 100ms)
- `--cpu-quota`: CPU time allocated per period

**Formula:**
```
CPUs = cpu-quota / cpu-period
```

**Example:**
```bash
# Limit to 1 CPU (100000/100000 = 1.0)
docker run --cpu-period=100000 --cpu-quota=100000 nginx

# Limit to 0.5 CPU (50000/100000 = 0.5)
docker run --cpu-period=100000 --cpu-quota=50000 nginx

# Limit to 2 CPUs (200000/100000 = 2.0)
docker run --cpu-period=100000 --cpu-quota=200000 nginx
```

**When to use:**
- ⚠️ Advanced scheduling requirements
- ⚠️ When `--cpus` doesn't provide enough control
- ⚠️ Custom scheduling periods needed

**Note:** `--cpus` is easier - use that unless you need period/quota specifically.

---

### 5. `--cpuset-mems` (NUMA Memory Nodes)

**Restricts memory nodes (NUMA) the container can use.**

**Syntax:**
```bash
docker run --cpuset-mems="<nodes>" <image>
```

**Description:** Pins container to specific NUMA memory nodes.

**Example:**
```bash
# Use memory node 0
docker run --cpuset-mems="0" nginx

# Use memory nodes 0 and 1
docker run --cpuset-mems="0,1" nginx
```

**Check NUMA nodes:**
```bash
numactl --hardware
```

**When to use:**
- ⚠️ NUMA systems only
- ⚠️ Performance optimization
- ⚠️ Large multi-socket servers

---

## Practical Examples

### Example 1: Basic CPU Limit

**Limit container to 1 CPU:**

```bash
docker run -d --name web \
  --cpus="1.0" \
  -p 8080:80 \
  nginx:1.27.0
```

**Test CPU usage:**
```bash
# Run CPU stress test
docker exec web sh -c "yes > /dev/null &"

# Monitor (should cap at 100% of 1 CPU)
docker stats web
```

---

### Example 2: Multiple Containers with Different Priorities

**High priority web server:**
```bash
docker run -d --name web-high \
  --cpu-shares=2048 \
  -p 8080:80 \
  nginx
```

**Low priority background job:**
```bash
docker run -d --name worker-low \
  --cpu-shares=512 \
  alpine sh -c "while true; do echo working; sleep 1; done"
```

**Result:** `web-high` gets 4x more CPU than `worker-low` when CPU is constrained.

---

### Example 3: CPU Pinning for Performance

**Pin database to specific cores:**
```bash
docker run -d --name postgres \
  --cpuset-cpus="0,1" \
  --cpuset-mems="0" \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

**Pin web server to different cores:**
```bash
docker run -d --name nginx \
  --cpuset-cpus="2,3" \
  --cpuset-mems="0" \
  -p 80:80 \
  nginx:1.27.0
```

**Result:** Database and web server run on separate CPU cores, reducing contention.

---

### Example 4: Development vs Production Resources

**Development (limited resources):**
```bash
docker run -d --name app-dev \
  --cpus="0.5" \
  --memory="512m" \
  -p 3000:3000 \
  myapp:dev
```

**Production (more resources):**
```bash
docker run -d --name app-prod \
  --cpus="2.0" \
  --memory="2g" \
  --cpu-shares=2048 \
  -p 3000:3000 \
  myapp:latest
```

---

### Example 5: Resource-Constrained Environment

**Multiple services on limited hardware:**

```bash
# Critical service - 2 CPUs
docker run -d --name critical \
  --cpus="2.0" \
  --cpu-shares=2048 \
  critical-app

# Normal service - 1 CPU
docker run -d --name normal \
  --cpus="1.0" \
  --cpu-shares=1024 \
  normal-app

# Background task - 0.5 CPU
docker run -d --name background \
  --cpus="0.5" \
  --cpu-shares=512 \
  background-worker
```

---

## Use Cases

### Use Case 1: Web Application with Multiple Replicas

**Problem:** Need to run 4 replicas on a 4-core machine without one replica hogging all CPU.

**Solution:**
```bash
# Each replica gets max 1 CPU
for i in {1..4}; do
  docker run -d --name web-$i \
    --cpus="1.0" \
    -p 808$i:80 \
    nginx
done
```

**Result:** Fair distribution, predictable performance.

---

### Use Case 2: Database + Application Isolation

**Problem:** Database and app fighting for CPU resources.

**Solution:**
```bash
# Database on cores 0-1 (2 CPUs)
docker run -d --name postgres \
  --cpuset-cpus="0,1" \
  --cpus="2.0" \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# App on cores 2-3 (2 CPUs)
docker run -d --name app \
  --cpuset-cpus="2,3" \
  --cpus="2.0" \
  -p 3000:3000 \
  myapp
```

**Result:** No CPU contention between database and app.

---

### Use Case 3: CI/CD Build Containers

**Problem:** Build jobs consuming all CPU, slowing down other services.

**Solution:**
```bash
# Build job with CPU limit
docker run --rm \
  --cpus="2.0" \
  --name build-job \
  -v $(pwd):/app \
  -w /app \
  node:22-alpine \
  npm run build
```

**Result:** Build doesn't starve other containers.

---

### Use Case 4: Multi-Tenant Environment

**Problem:** Multiple customers on same host, need fair resource allocation.

**Solution:**
```bash
# Customer A (premium - 2 CPUs)
docker run -d --name customer-a \
  --cpus="2.0" \
  --cpu-shares=2048 \
  customer-a-app

# Customer B (standard - 1 CPU)
docker run -d --name customer-b \
  --cpus="1.0" \
  --cpu-shares=1024 \
  customer-b-app

# Customer C (basic - 0.5 CPU)
docker run -d --name customer-c \
  --cpus="0.5" \
  --cpu-shares=512 \
  customer-c-app
```

**Result:** Resource guarantees per customer tier.

---

### Use Case 5: Real-Time Application

**Problem:** Need guaranteed CPU for time-sensitive processing.

**Solution:**
```bash
# Pin real-time app to dedicated cores
docker run -d --name realtime-app \
  --cpuset-cpus="0,1" \
  --cpus="2.0" \
  --cpu-shares=4096 \
  realtime-processing-app
```

**Result:** Consistent, predictable performance.

---

## Monitoring CPU Usage

### Using `docker stats`

**Real-time monitoring:**
```bash
# All containers
docker stats

# Specific container
docker stats <container-name>

# Specific columns
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

**Example output:**
```
CONTAINER ID   NAME      CPU %     MEM USAGE / LIMIT
a1b2c3d4e5f6   web       25.67%    256MiB / 512MiB
f6e5d4c3b2a1   db        98.23%    1.2GiB / 2GiB
```

---

### Using `docker inspect`

**Check CPU limits:**
```bash
docker inspect <container> | grep -A 10 "CpuShares\|NanoCpus\|CpusetCpus"
```

**Example:**
```bash
docker inspect web | grep -A 5 Cpu
```

**Output:**
```json
"CpuShares": 1024,
"NanoCpus": 1000000000,
"CpusetCpus": "0,1",
```

**NanoCpus explanation:**
- 1 CPU = 1,000,000,000 nanocpus
- 0.5 CPU = 500,000,000 nanocpus

---

### Using `docker top`

**View processes and CPU usage:**
```bash
docker top <container>
```

**Example output:**
```
UID    PID    PPID   C    STIME   TTY   TIME       CMD
root   1234   1220   0    14:30   ?     00:00:01   nginx: master
nginx  1235   1234   2    14:30   ?     00:00:15   nginx: worker
```

---

### System-Level Monitoring

**Check host CPU:**
```bash
# Overall CPU usage
top

# Or htop (more user-friendly)
htop

# CPU per core
mpstat -P ALL 1
```

**Check cgroup limits:**
```bash
# CPU quota
cat /sys/fs/cgroup/cpu/docker/<container-id>/cpu.cfs_quota_us

# CPU period
cat /sys/fs/cgroup/cpu/docker/<container-id>/cpu.cfs_period_us

# CPU shares
cat /sys/fs/cgroup/cpu/docker/<container-id>/cpu.shares
```

---

## Best Practices

### ✅ Do's

1. **Always set CPU limits in production**
   ```bash
   docker run --cpus="2.0" myapp
   ```

2. **Use `--cpus` for simplicity**
   ```bash
   # Recommended (simple, clear)
   docker run --cpus="1.5" nginx

   # Avoid unless needed (complex)
   docker run --cpu-period=100000 --cpu-quota=150000 nginx
   ```

3. **Monitor CPU usage regularly**
   ```bash
   docker stats --no-stream
   ```

4. **Set appropriate limits based on workload**
   ```bash
   # Heavy computation
   docker run --cpus="4.0" compute-job

   # Light web service
   docker run --cpus="0.5" static-site
   ```

5. **Use CPU pinning for performance-critical apps**
   ```bash
   docker run --cpuset-cpus="0,1" database
   ```

6. **Combine CPU limits with memory limits**
   ```bash
   docker run --cpus="2.0" --memory="2g" myapp
   ```

7. **Document resource requirements**
   ```yaml
   # docker-compose.yml
   services:
     web:
       deploy:
         resources:
           limits:
             cpus: '2.0'
             memory: 2G
   ```

---

### ❌ Don'ts

1. **Don't leave production containers unlimited**
   ```bash
   # ❌ Bad (no limits)
   docker run myapp

   # ✅ Good (with limits)
   docker run --cpus="2.0" myapp
   ```

2. **Don't over-allocate CPUs**
   ```bash
   # ❌ Bad on 4-core machine
   docker run --cpus="8.0" myapp

   # ✅ Good
   docker run --cpus="3.0" myapp  # Leave 1 CPU for system
   ```

3. **Don't ignore CPU shares in multi-container setups**
   ```bash
   # ❌ Bad (all equal priority)
   docker run --cpus="1.0" critical-app
   docker run --cpus="1.0" background-job

   # ✅ Good (prioritized)
   docker run --cpus="1.0" --cpu-shares=2048 critical-app
   docker run --cpus="1.0" --cpu-shares=512 background-job
   ```

4. **Don't pin all containers to same cores**
   ```bash
   # ❌ Bad (all on same cores - defeats purpose)
   docker run --cpuset-cpus="0,1" app1
   docker run --cpuset-cpus="0,1" app2

   # ✅ Good (separated)
   docker run --cpuset-cpus="0,1" app1
   docker run --cpuset-cpus="2,3" app2
   ```

5. **Don't forget about burst workloads**
   ```bash
   # ❌ Bad (too restrictive for bursty workload)
   docker run --cpus="0.5" web-app

   # ✅ Good (allows bursts, controlled with shares)
   docker run --cpu-shares=512 web-app
   ```

---

## Comparison Table

| Flag | Type | Default | Use Case | Complexity |
|------|------|---------|----------|------------|
| `--cpus` | Hard limit | Unlimited | General use | ⭐ Simple |
| `--cpu-shares` | Relative weight | 1024 | Priority scheduling | ⭐⭐ Medium |
| `--cpuset-cpus` | Core pinning | All cores | Performance isolation | ⭐⭐ Medium |
| `--cpu-period` + `--cpu-quota` | Advanced limit | 100000 / unlimited | Custom scheduling | ⭐⭐⭐ Complex |
| `--cpuset-mems` | NUMA pinning | All nodes | NUMA optimization | ⭐⭐⭐ Complex |

---

## Troubleshooting

### Container Using More CPU Than Expected

**Check current limits:**
```bash
docker inspect <container> --format='{{.HostConfig.NanoCpus}}'
```

**If 0:** No CPU limit set

**Solution:**
```bash
# Stop container
docker stop <container>

# Remove and recreate with limits
docker rm <container>
docker run --cpus="2.0" ...
```

**Or update running container (Docker 1.10+):**
```bash
docker update --cpus="2.0" <container>
```

---

### CPU Limit Not Being Enforced

**Verify cgroup support:**
```bash
docker info | grep -i cgroup
```

**Check kernel support:**
```bash
grep CONFIG_CFS_BANDWIDTH /boot/config-$(uname -r)
# Should show: CONFIG_CFS_BANDWIDTH=y
```

---

### Performance Issues with CPU Limits

**Problem:** Application slower than expected

**Diagnosis:**
```bash
# Check if CPU is maxed out
docker stats <container>
```

**If CPU at 100%:**
- Increase CPU limit: `docker update --cpus="4.0" <container>`
- Optimize application code
- Scale horizontally (more containers)

**If CPU not maxed:**
- Check memory limits
- Check disk I/O
- Check network
- Profile application

---

### CPU Pinning Not Working

**Check available cores:**
```bash
nproc  # Total cores
```

**Verify pinning:**
```bash
docker inspect <container> --format='{{.HostConfig.CpusetCpus}}'
```

**Test with stress:**
```bash
# Install stress in container
docker exec <container> apt-get update && apt-get install -y stress

# Run stress on 1 CPU
docker exec <container> stress --cpu 1 --timeout 60s

# Monitor which core is used
htop  # Look for 100% on specific core
```

---

## Quick Reference

```bash
# Basic CPU limit (recommended)
docker run --cpus="2.0" <image>

# CPU priority/weight
docker run --cpu-shares=2048 <image>

# CPU core pinning
docker run --cpuset-cpus="0,1" <image>

# Advanced quota
docker run --cpu-period=100000 --cpu-quota=200000 <image>

# Monitor CPU usage
docker stats <container>

# Update CPU limit (running container)
docker update --cpus="3.0" <container>

# Check CPU limits
docker inspect <container> | grep -i cpu

# Multiple limits combined
docker run --cpus="2.0" --cpu-shares=2048 --cpuset-cpus="0-3" <image>
```

---

## Docker Compose Examples

### Basic CPU Limits

```yaml
version: '3.8'

services:
  web:
    image: nginx
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Multiple Services with Different Priorities

```yaml
version: '3.8'

services:
  database:
    image: postgres:16-alpine
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
    cpuset: '0,1'  # Cores 0 and 1

  web:
    image: nginx
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
    cpuset: '2,3'  # Cores 2 and 3

  worker:
    image: worker-app
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    cpu_shares: 512
```

---

## Summary

### When to Use What:

**`--cpus`**:
- ✅ Default choice for most use cases
- Hard limit on CPU usage
- Simple and effective

**`--cpu-shares`**:
- ✅ Priority-based scheduling
- Only matters when CPU constrained
- Good for mixed workloads

**`--cpuset-cpus`**:
- ✅ Performance isolation
- NUMA optimization
- Dedicated CPU cores for critical apps

**`--cpu-period` + `--cpu-quota`**:
- ⚠️ Advanced use cases only
- Custom scheduling requirements
- Use `--cpus` instead unless you need this

**Key Takeaway:** Start with `--cpus`, add `--cpu-shares` for priorities, use `--cpuset-cpus` for performance isolation.

---

## Additional Resources

- [Docker Runtime Options](https://docs.docker.com/config/containers/resource_constraints/)
- [CGroup CPU Documentation](https://www.kernel.org/doc/Documentation/scheduler/sched-bwc.txt)
- [Docker Resource Management](https://docs.docker.com/config/containers/resource_constraints/)
- [NUMA and Docker](https://www.kernel.org/doc/html/latest/vm/numa.html)

# Docker CPU and Memory Resource Management Guide

Comprehensive guide to managing CPU and memory resources for Docker containers with practical examples and real-world use cases.

## 📚 Table of Contents

### CPU Management
1. [CPU Overview](#cpu-overview)
2. [CPU Limit Options](#cpu-limit-options)
3. [CPU Examples](#cpu-examples)

### Memory Management
4. [Memory Overview](#memory-overview)
5. [Memory Limit Options](#memory-limit-options)
6. [Memory Examples](#memory-examples)
7. [OOM Behavior](#oom-out-of-memory-behavior)

### Combined Usage
8. [CPU + Memory Together](#cpu--memory-together)
9. [Monitoring Resources](#monitoring-resources)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

# CPU Management

## CPU Overview

By default, Docker containers have **unlimited access** to the host's CPU resources. This can lead to:
- One container consuming all CPU
- Resource starvation for other containers
- Unpredictable performance

**Solution:** Use Docker's CPU resource flags to limit and control CPU usage.

---

## CPU Limit Options

### 1. `--cpus` (Recommended)

**Most common and easiest to use.**

**Syntax:**
```bash
docker run --cpus="<value>" <image>
```

**Values:**
- `1.0` = 1 full CPU core
- `0.5` = Half a CPU core
- `2.0` = 2 full CPU cores

**Example:**
```bash
# Limit to 1.5 CPUs
docker run --cpus="1.5" nginx

# Limit to 50% of one CPU
docker run --cpus="0.5" nginx
```

---

### 2. `--cpu-shares` (Relative Priority)

**Controls CPU priority when resources are constrained.**

**Syntax:**
```bash
docker run --cpu-shares=<value> <image>
```

**Default:** 1024

**Example:**
```bash
# High priority (2x default)
docker run --cpu-shares=2048 --name high-priority nginx

# Low priority (half default)
docker run --cpu-shares=512 --name low-priority nginx
```

---

### 3. `--cpuset-cpus` (Core Pinning)

**Pins container to specific CPU cores.**

**Syntax:**
```bash
docker run --cpuset-cpus="<cores>" <image>
```

**Example:**
```bash
# Run on cores 0 and 1
docker run --cpuset-cpus="0,1" nginx

# Run on cores 2-5
docker run --cpuset-cpus="2-5" nginx
```

---

## CPU Examples

### Example 1: Web Server with CPU Limit

```bash
docker run -d --name web \
  --cpus="2.0" \
  -p 8080:80 \
  nginx
```

### Example 2: Background Worker with Low Priority

```bash
docker run -d --name worker \
  --cpus="1.0" \
  --cpu-shares=512 \
  background-worker
```

### Example 3: Database with CPU Pinning

```bash
docker run -d --name postgres \
  --cpuset-cpus="0,1" \
  --cpus="2.0" \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine
```

---

# Memory Management

## Memory Overview

**Why memory limits matter:**
- Prevents containers from consuming all host memory
- Avoids OOM (Out of Memory) killer affecting host
- Ensures predictable application behavior
- Required for container orchestration (Kubernetes, Swarm)

**Default behavior:** Unlimited memory access

---

## Memory Limit Options

### 1. `--memory` / `-m` (Hard Limit)

**Primary memory limit - most important flag.**

**Syntax:**
```bash
docker run --memory=<amount> <image>
docker run -m <amount> <image>
```

**Units:**
- `b` = bytes
- `k` = kilobytes
- `m` = megabytes
- `g` = gigabytes

**Examples:**
```bash
# 512 megabytes
docker run -m 512m nginx

# 2 gigabytes
docker run --memory=2g postgres

# 256 megabytes
docker run -m 256m redis
```

**What happens when limit is reached:**
- Container processes are killed by OOM killer
- Container exits with error
- Unless `--oom-kill-disable` is set (not recommended)

---

### 2. `--memory-swap` (Memory + Swap Limit)

**Controls total memory (RAM + swap) available to container.**

**Syntax:**
```bash
docker run --memory=<ram> --memory-swap=<total> <image>
```

**Behavior:**
- `--memory-swap` = total memory (RAM + swap)
- Swap = `--memory-swap` minus `--memory`
- If `--memory-swap` not set: swap = 2x memory
- If `--memory-swap` = `-1`: unlimited swap
- If `--memory-swap` = `--memory`: no swap

**Examples:**

**No swap (recommended for production):**
```bash
# 1GB RAM, 0 swap
docker run -m 1g --memory-swap=1g nginx
```

**With swap:**
```bash
# 1GB RAM, 1GB swap (2GB total)
docker run -m 1g --memory-swap=2g nginx
```

**Default (2x memory as swap):**
```bash
# 1GB RAM, 2GB swap (3GB total)
docker run -m 1g nginx
```

**Unlimited swap:**
```bash
# 1GB RAM, unlimited swap
docker run -m 1g --memory-swap=-1 nginx
```

---

### 3. `--memory-reservation` (Soft Limit)

**Soft limit - container can exceed but will be throttled if host is low on memory.**

**Syntax:**
```bash
docker run --memory-reservation=<amount> <image>
```

**Use case:** Allow bursts above reservation when memory available.

**Example:**
```bash
# Reserve 512MB, but can use more if available
docker run -m 2g --memory-reservation=512m nginx
```

**Behavior:**
- Container tries to stay under reservation
- Can use up to `--memory` limit
- Gets throttled back to reservation if host needs memory

---

### 4. `--memory-swappiness` (Swap Tendency)

**Controls how aggressively kernel swaps memory to disk.**

**Syntax:**
```bash
docker run --memory-swappiness=<0-100> <image>
```

**Values:**
- `0` = Avoid swapping (keep in RAM)
- `100` = Swap aggressively
- Default: inherit from host (usually 60)

**Example:**
```bash
# Avoid swapping (keep in RAM)
docker run -m 2g --memory-swappiness=0 database

# Allow aggressive swapping
docker run -m 1g --memory-swappiness=100 cache
```

**When to use:**
- `0`: Databases, performance-critical apps
- `60-80`: General applications
- `100`: Cache, non-critical workloads

---

### 5. `--kernel-memory` (Kernel Memory Limit)

**Limits kernel memory usage (network buffers, etc.).**

**Syntax:**
```bash
docker run --kernel-memory=<amount> <image>
```

**Example:**
```bash
docker run -m 2g --kernel-memory=100m nginx
```

**⚠️ Advanced use case** - rarely needed for most applications.

---

### 6. `--oom-kill-disable` (Disable OOM Killer)

**Disables Out of Memory killer for this container.**

**Syntax:**
```bash
docker run --oom-kill-disable <image>
```

**⚠️ WARNING:** Use with caution!

**Requirements:**
- MUST set `--memory` limit
- Otherwise can crash entire host

**Example:**
```bash
# Safe: has memory limit
docker run -m 1g --oom-kill-disable nginx

# DANGEROUS: no memory limit, can crash host
# docker run --oom-kill-disable nginx  # DON'T DO THIS
```

---

### 7. `--oom-score-adj` (OOM Priority)

**Adjusts priority for OOM killer (-1000 to 1000).**

**Syntax:**
```bash
docker run --oom-score-adj=<value> <image>
```

**Values:**
- `-1000` = Never kill (protect)
- `0` = Default priority
- `1000` = Kill first

**Example:**
```bash
# Protect critical database
docker run --oom-score-adj=-500 postgres

# Kill cache first if needed
docker run --oom-score-adj=500 redis
```

---

## Memory Examples

### Example 1: Basic Memory Limit

**Limit container to 512MB:**

```bash
docker run -d --name web \
  -m 512m \
  -p 8080:80 \
  nginx
```

**Test memory limit:**
```bash
# Fill memory (will be killed at 512MB)
docker exec web sh -c "tail /dev/zero"

# Monitor memory usage
docker stats web
```

---

### Example 2: Production Database (No Swap)

```bash
docker run -d --name postgres \
  -m 4g \
  --memory-swap=4g \
  --memory-swappiness=0 \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

**Why:**
- `-m 4g`: 4GB RAM limit
- `--memory-swap=4g`: No swap (total = RAM)
- `--memory-swappiness=0`: Keep in RAM, don't swap
- Critical for database performance

---

### Example 3: Caching Service (Allow Swap)

```bash
docker run -d --name redis \
  -m 2g \
  --memory-swap=4g \
  --memory-swappiness=80 \
  -p 6379:6379 \
  redis:7-alpine
```

**Why:**
- `-m 2g`: 2GB RAM
- `--memory-swap=4g`: 2GB swap allowed
- `--memory-swappiness=80`: OK to swap if needed
- Cache can tolerate being swapped to disk

---

### Example 4: Memory Reservation with Burst

```bash
docker run -d --name app \
  -m 2g \
  --memory-reservation=512m \
  myapp
```

**Behavior:**
- Normally uses ~512MB
- Can burst up to 2GB when needed
- Throttled back to 512MB if host is low on memory

---

### Example 5: Development Environment

```bash
docker run -d --name dev-env \
  -m 1g \
  --memory-swap=2g \
  -p 3000:3000 \
  -v ./src:/app/src \
  react-app:dev
```

**Why:**
- Limited resources for development
- Swap allowed for flexibility
- Prevents dev container from consuming all memory

---

### Example 6: Multiple Containers with Different Memory

```bash
# Critical service - 4GB
docker run -d --name critical \
  -m 4g \
  --memory-swap=4g \
  --oom-score-adj=-500 \
  critical-app

# Normal service - 2GB
docker run -d --name normal \
  -m 2g \
  --memory-swap=2g \
  normal-app

# Background task - 512MB
docker run -d --name background \
  -m 512m \
  --memory-swap=1g \
  --oom-score-adj=500 \
  background-worker
```

**Priority if OOM:**
1. Keep `critical` alive (oom-score-adj=-500)
2. Keep `normal` running
3. Kill `background` first (oom-score-adj=500)

---

## OOM (Out of Memory) Behavior

### What Happens When Container Exceeds Memory Limit?

**Default behavior:**

1. Container process exceeds `--memory` limit
2. OOM killer activates
3. Processes in container are killed
4. Container exits with code 137

**Example:**
```bash
# Create container with 100MB limit
docker run -d --name test -m 100m alpine sleep 3600

# Try to allocate 200MB (will fail)
docker exec test sh -c "dd if=/dev/zero of=/tmp/file bs=1M count=200"

# Container killed, check exit code
docker inspect test --format='{{.State.ExitCode}}'
# Output: 137 (128 + 9, where 9 = SIGKILL)
```

---

### Checking OOM Kills

**Check if container was OOM killed:**
```bash
docker inspect <container> --format='{{.State.OOMKilled}}'
# Output: true or false
```

**View logs:**
```bash
# Container logs
docker logs <container>

# System logs
dmesg | grep -i oom
journalctl -k | grep -i oom
```

---

### Preventing OOM Kills

**1. Set appropriate memory limits:**
```bash
# Test and determine actual memory usage
docker stats <container>

# Set limit with buffer (e.g., +20%)
docker run -m 1200m myapp  # if app uses ~1000m
```

**2. Use memory reservation for bursts:**
```bash
docker run -m 2g --memory-reservation=1g myapp
```

**3. Monitor and alert:**
```bash
# Continuous monitoring
watch -n 1 'docker stats --no-stream'

# Alert when near limit
docker stats --format "{{.MemPerc}}" | awk '{if ($1 > 80) print "WARNING"}'
```

---

## CPU + Memory Together

### Combined Resource Limits

**Best practice:** Always set both CPU and memory limits in production.

### Example 1: Balanced Web Application

```bash
docker run -d --name web \
  --cpus="2.0" \
  -m 2g \
  --memory-swap=2g \
  -p 8080:80 \
  nginx
```

**Resources:**
- 2 CPU cores
- 2GB RAM
- No swap

---

### Example 2: Resource-Constrained Environment

```bash
# High priority - more resources
docker run -d --name critical \
  --cpus="4.0" \
  --cpu-shares=2048 \
  -m 4g \
  --memory-swap=4g \
  --oom-score-adj=-500 \
  critical-app

# Medium priority
docker run -d --name medium \
  --cpus="2.0" \
  --cpu-shares=1024 \
  -m 2g \
  --memory-swap=2g \
  medium-app

# Low priority - limited resources
docker run -d --name low \
  --cpus="1.0" \
  --cpu-shares=512 \
  -m 1g \
  --memory-swap=2g \
  --oom-score-adj=500 \
  low-priority-app
```

---

### Example 3: Development vs Production

**Development:**
```bash
docker run -d --name app-dev \
  --cpus="0.5" \
  -m 512m \
  --memory-swap=1g \
  -p 3000:3000 \
  myapp:dev
```

**Staging:**
```bash
docker run -d --name app-staging \
  --cpus="2.0" \
  -m 2g \
  --memory-swap=2g \
  -p 3000:3000 \
  myapp:latest
```

**Production:**
```bash
docker run -d --name app-prod \
  --cpus="4.0" \
  --cpu-shares=2048 \
  -m 4g \
  --memory-swap=4g \
  --memory-swappiness=0 \
  --oom-score-adj=-500 \
  -p 3000:3000 \
  myapp:latest
```

---

### Example 4: Microservices Stack

```bash
# Database (high memory, CPU pinning)
docker run -d --name postgres \
  --cpuset-cpus="0,1" \
  --cpus="2.0" \
  -m 4g \
  --memory-swap=4g \
  --memory-swappiness=0 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# API Server (balanced resources)
docker run -d --name api \
  --cpuset-cpus="2,3" \
  --cpus="2.0" \
  -m 2g \
  --memory-swap=2g \
  -p 8080:8080 \
  api-server

# Cache (memory optimized, can swap)
docker run -d --name redis \
  --cpus="1.0" \
  -m 2g \
  --memory-swap=4g \
  --memory-swappiness=80 \
  -p 6379:6379 \
  redis:7-alpine

# Worker (low priority)
docker run -d --name worker \
  --cpus="1.0" \
  --cpu-shares=512 \
  -m 1g \
  --memory-swap=2g \
  --oom-score-adj=500 \
  background-worker
```

---

## Monitoring Resources

### Using `docker stats`

**Real-time monitoring:**
```bash
# All containers
docker stats

# Specific container
docker stats <container-name>

# Custom format
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

**Example output:**
```
CONTAINER    CPU %    MEM USAGE / LIMIT      MEM %
web          25.67%   256MiB / 512MiB        50.00%
db           98.23%   3.8GiB / 4GiB          95.00%
cache        5.12%    512MiB / 2GiB          25.00%
```

---

### Using `docker inspect`

**Check resource limits:**
```bash
# CPU limits
docker inspect <container> | grep -A 10 "Cpu"

# Memory limits
docker inspect <container> | grep -A 10 "Memory"
```

**Example:**
```bash
docker inspect web --format='CPU: {{.HostConfig.NanoCpus}}, Memory: {{.HostConfig.Memory}}'
# Output: CPU: 2000000000, Memory: 536870912 (512MB in bytes)
```

---

### Memory-Specific Monitoring

**Check memory stats:**
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

**Check OOM status:**
```bash
docker inspect <container> --format='OOM Killed: {{.State.OOMKilled}}'
```

**Memory usage details:**
```bash
# Container's memory cgroup
cat /sys/fs/cgroup/memory/docker/<container-id>/memory.usage_in_bytes

# Memory limit
cat /sys/fs/cgroup/memory/docker/<container-id>/memory.limit_in_bytes

# Memory stats
cat /sys/fs/cgroup/memory/docker/<container-id>/memory.stat
```

---

## Best Practices

### ✅ Do's

**1. Always set memory limits in production**
```bash
docker run -m 2g myapp
```

**2. Disable swap for performance-critical apps**
```bash
docker run -m 4g --memory-swap=4g --memory-swappiness=0 database
```

**3. Set both CPU and memory together**
```bash
docker run --cpus="2.0" -m 2g myapp
```

**4. Use memory reservation for burst workloads**
```bash
docker run -m 4g --memory-reservation=2g web-app
```

**5. Monitor memory usage before setting limits**
```bash
docker stats <container>
# Observe peak usage, add 20-30% buffer
```

**6. Set OOM priorities for critical services**
```bash
docker run --oom-score-adj=-500 critical-db
```

**7. Test memory limits before production**
```bash
# Load test with memory limit
docker run -m 2g myapp
# Run stress tests, monitor behavior
```

---

### ❌ Don'ts

**1. Don't leave production containers unlimited**
```bash
# ❌ Bad
docker run myapp

# ✅ Good
docker run --cpus="2.0" -m 2g myapp
```

**2. Don't set memory limits too low**
```bash
# ❌ Bad (app needs 1GB, set to 512MB)
docker run -m 512m myapp

# ✅ Good (set with buffer)
docker run -m 1200m myapp
```

**3. Don't disable OOM without memory limit**
```bash
# ❌ DANGEROUS (can crash host)
docker run --oom-kill-disable myapp

# ✅ Safe
docker run -m 2g --oom-kill-disable myapp
```

**4. Don't ignore swap for databases**
```bash
# ❌ Bad (swap kills database performance)
docker run -m 4g postgres

# ✅ Good (no swap)
docker run -m 4g --memory-swap=4g --memory-swappiness=0 postgres
```

**5. Don't over-allocate resources**
```bash
# ❌ Bad on 16GB host
docker run -m 20g myapp

# ✅ Good (leave room for host)
docker run -m 14g myapp
```

---

## Comparison Tables

### Memory Options Comparison

| Flag | Type | Default | Use Case | Risk |
|------|------|---------|----------|------|
| `--memory` / `-m` | Hard limit | Unlimited | Required | Medium (OOM kill) |
| `--memory-swap` | Total limit | 2x memory | Control swap | Low |
| `--memory-reservation` | Soft limit | None | Burst workloads | Low |
| `--memory-swappiness` | Swap tendency | Host default | Performance | Low |
| `--oom-kill-disable` | Disable OOM | false | Critical apps | HIGH (host crash) |
| `--oom-score-adj` | OOM priority | 0 | Prioritization | Low |

---

### CPU + Memory Combinations

| Workload | CPU | Memory | Swap | Swappiness |
|----------|-----|--------|------|------------|
| Web Server | `2.0` | `2g` | `2g` | `0` |
| Database | `4.0` | `8g` | `8g` | `0` |
| Cache | `1.0` | `4g` | `8g` | `80` |
| Worker | `2.0` | `2g` | `4g` | `60` |
| Dev Environment | `1.0` | `1g` | `2g` | `60` |

---

## Troubleshooting

### Container Keeps Getting OOM Killed

**Problem:** Container exits with code 137

**Diagnosis:**
```bash
# Check if OOM killed
docker inspect <container> --format='{{.State.OOMKilled}}'
# Output: true

# Check memory limit
docker inspect <container> --format='{{.HostConfig.Memory}}'

# View system OOM logs
dmesg | grep -i oom
```

**Solutions:**

**1. Increase memory limit:**
```bash
docker run -m 4g myapp  # was 2g
```

**2. Add memory reservation:**
```bash
docker run -m 4g --memory-reservation=2g myapp
```

**3. Enable swap:**
```bash
docker run -m 2g --memory-swap=4g myapp
```

**4. Optimize application:**
- Fix memory leaks
- Reduce memory usage
- Implement caching strategies

---

### High Memory Usage

**Problem:** Container using more memory than expected

**Diagnosis:**
```bash
# Monitor real-time usage
docker stats <container>

# Check detailed memory stats
cat /sys/fs/cgroup/memory/docker/<id>/memory.stat
```

**Solutions:**

**1. Profile application:**
```bash
# Node.js
docker exec <container> node --inspect app.js

# Python
docker exec <container> python -m memory_profiler app.py

# Java
docker exec <container> jmap -heap <pid>
```

**2. Set stricter limits:**
```bash
docker run -m 2g --memory-swap=2g myapp
```

**3. Use memory reservation:**
```bash
docker run -m 4g --memory-reservation=2g myapp
```

---

### Swap Causing Performance Issues

**Problem:** Container slow due to swapping

**Diagnosis:**
```bash
# Check swap usage
docker stats <container>

# System swap
free -h
```

**Solutions:**

**1. Disable swap:**
```bash
docker run -m 4g --memory-swap=4g myapp
```

**2. Reduce swappiness:**
```bash
docker run -m 4g --memory-swappiness=0 myapp
```

**3. Increase memory:**
```bash
docker run -m 8g myapp
```

---

### Cannot Set Memory Limits

**Problem:** Memory limits not working

**Check:**
```bash
# Verify cgroup support
docker info | grep -i cgroup

# Check kernel memory support
grep CONFIG_MEMCG /boot/config-$(uname -r)
# Should show: CONFIG_MEMCG=y
```

**Enable cgroup v2 (if needed):**
```bash
# Add to /etc/default/grub
GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=1"

# Update grub
sudo update-grub
sudo reboot
```

---

## Docker Compose Examples

### Full Stack with Resource Limits

```yaml
version: '3.8'

services:
  database:
    image: postgres:16-alpine
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
        reservations:
          cpus: '2.0'
          memory: 4G
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    # No swap for database
    mem_swappiness: 0

  api:
    image: api-server
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
    ports:
      - "8080:8080"
    depends_on:
      - database

  cache:
    image: redis:7-alpine
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 4G
        reservations:
          cpus: '0.5'
          memory: 2G
    # Allow swap for cache
    mem_swappiness: 80

  worker:
    image: background-worker
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
    # Low priority
    oom_score_adj: 500

volumes:
  pgdata:
```

---

## Quick Reference Commands

```bash
# CPU Limits
docker run --cpus="2.0" <image>
docker run --cpu-shares=2048 <image>
docker run --cpuset-cpus="0,1" <image>

# Memory Limits
docker run -m 2g <image>
docker run -m 2g --memory-swap=2g <image>  # No swap
docker run -m 2g --memory-reservation=1g <image>
docker run -m 2g --memory-swappiness=0 <image>

# Combined
docker run --cpus="2.0" -m 2g --memory-swap=2g <image>

# Monitoring
docker stats <container>
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Update running container
docker update --cpus="4.0" -m 4g <container>

# Check limits
docker inspect <container> --format='CPU: {{.HostConfig.NanoCpus}}, Memory: {{.HostConfig.Memory}}'

# Check OOM status
docker inspect <container> --format='OOMKilled: {{.State.OOMKilled}}'
```

---

## Summary

### Key Takeaways

**CPU:**
- Use `--cpus` for hard limits
- Use `--cpu-shares` for priorities
- Use `--cpuset-cpus` for core pinning

**Memory:**
- Always set `--memory` in production
- Disable swap for databases: `--memory-swap=<same-as-memory>`
- Use `--memory-swappiness=0` for performance
- Set `--memory-reservation` for burst workloads
- Monitor for OOM kills

**Best Combination:**
```bash
docker run -d \
  --cpus="2.0" \
  -m 2g \
  --memory-swap=2g \
  --memory-swappiness=0 \
  --oom-score-adj=-500 \
  myapp
```

---

## Additional Resources

- [Docker Runtime Options](https://docs.docker.com/config/containers/resource_constraints/)
- [Memory Resource Controller](https://www.kernel.org/doc/Documentation/cgroup-v1/memory.txt)
- [CGroup Memory](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- [OOM Killer](https://www.kernel.org/doc/gorman/html/understand/understand016.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
