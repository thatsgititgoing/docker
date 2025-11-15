# Docker Volumes Reference Guide

This guide documents Docker volume usage with real-world examples executed in this environment.

## 📚 Table of Contents

1. [What are Docker Volumes?](#what-are-docker-volumes)
2. [Types of Volume Mounts](#types-of-volume-mounts)
3. [Real-World Examples](#real-world-examples)
4. [Volume Storage Locations](#volume-storage-locations)
5. [Common Operations](#common-operations)
6. [Data Persistence](#data-persistence)
7. [Best Practices](#best-practices)

---

## What are Docker Volumes?

**Docker volumes** are the preferred mechanism for persisting data generated and used by Docker containers. Volumes have several advantages over bind mounts:

- **Managed by Docker** - Easier to back up and migrate
- **Work on all platforms** - Linux, Windows, macOS
- **Isolated from host** - Better security
- **Sharable** - Multiple containers can use the same volume
- **Persistent** - Data survives container deletion

---

## Types of Volume Mounts

Docker supports three types of mounts for persisting data:

### 1. Named Volumes (Docker-Managed)

**Definition:** Volumes created and managed by Docker.

**Syntax:**
```bash
docker run -v <volume-name>:<container-path> <image>
```

**Example from this session:**
```bash
docker run -d -p 3000:80 --name website-main -v website-data:/usr/share/nginx/html nginx:1.27.0
```

**Storage location:**
```
/var/lib/docker/volumes/website-data/_data
```

**Use cases:**
- ✅ Database storage (PostgreSQL, MySQL, MongoDB)
- ✅ Application data that needs to persist
- ✅ Shared data between containers
- ✅ Production deployments

### 2. Bind Mounts (Host-Managed)

**Definition:** Direct mapping to a host directory.

**Syntax:**
```bash
docker run -v <host-path>:<container-path> <image>
```

**Example from this session (React app development):**
```bash
docker run --rm -d -p 3000:3000 -v ./public:/app/public -v ./src:/app/src react-app:dev
```

**Storage location:**
```
/home/alex/docker/my-react-app/public
/home/alex/docker/my-react-app/src
```

**Use cases:**
- ✅ Development with hot reloading
- ✅ Source code mounting
- ✅ Configuration files
- ✅ When you need direct file access

### 3. Anonymous Volumes

**Definition:** Volumes created without a name.

**Syntax:**
```bash
docker run -v <container-path> <image>
```

**Example:**
```bash
docker run -v /app/data nginx
```

**Storage location:**
```
/var/lib/docker/volumes/<random-hash>/_data
```

**Use cases:**
- ⚠️ Temporary data
- ⚠️ Less common (prefer named volumes)

---

## Real-World Examples

### Example 1: Nginx Website with Named Volume

**Command executed:**
```bash
docker run -d -p 3000:80 --name website-main -v website-data:/usr/share/nginx/html nginx:1.27.0
```

**What this does:**
- Creates/uses volume named `website-data`
- Mounts it to `/usr/share/nginx/html` in container
- Nginx serves files from this volume
- Data persists when container is removed

**Inspect the mount:**
```bash
docker inspect website-main | grep -A 20 "Mounts"
```

**Output:**
```json
"Mounts": [
    {
        "Type": "volume",
        "Name": "website-data",
        "Source": "/var/lib/docker/volumes/website-data/_data",
        "Destination": "/usr/share/nginx/html",
        "Driver": "local",
        "Mode": "z",
        "RW": true,
        "Propagation": ""
    }
]
```

### Example 2: React Development with Bind Mounts

**Command executed:**
```bash
docker run --rm -d -p 3000:3000 -v ./public:/app/public -v ./src:/app/src react-app:dev
```

**What this does:**
- Mounts host directories `./public` and `./src` into container
- Changes on host immediately reflect in container
- Enables hot module replacement (HMR)
- No data copying - direct filesystem access

**File synchronization:**
```
Host Machine                     Container
/home/alex/docker/my-react-app/
├── src/                    ←→   /app/src/
│   └── App.js                   └── App.js (synced in real-time)
└── public/                 ←→   /app/public/
    └── index.html               └── index.html (synced in real-time)
```

### Example 3: PostgreSQL Database

**Command:**
```bash
docker run -d \
  --name postgres-db \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine
```

**Benefits:**
- Database data survives container restarts
- Can upgrade PostgreSQL container without losing data
- Easy backup: `docker run --rm -v pgdata:/data -v $(pwd):/backup alpine tar czf /backup/pgdata.tar.gz -C /data .`

---

## Volume Storage Locations

### On Linux (Your System)

**Named volumes:**
```
/var/lib/docker/volumes/<volume-name>/_data
```

**Example:**
```bash
# List volume storage location
docker volume inspect website-data --format '{{ .Mountpoint }}'
# Output: /var/lib/docker/volumes/website-data/_data

# View files (requires sudo)
sudo ls -la /var/lib/docker/volumes/website-data/_data
```

**Bind mounts:**
```
<absolute-path-you-specified>
```

**Example:**
```bash
# Your bind mount
-v ./src:/app/src

# Actual location
/home/alex/docker/my-react-app/src
```

### On macOS

```
~/Library/Containers/com.docker.docker/Data/vms/0/
```

Or access via Docker Desktop GUI or temporary container.

### On Windows

```
# WSL2 backend
\\wsl$\docker-desktop-data\data\docker\volumes

# Hyper-V backend
C:\ProgramData\Docker\volumes\
```

---

## Common Operations

### Create Volume

**Create named volume:**
```bash
docker volume create my-volume
```

**Create volume with specific driver:**
```bash
docker volume create --driver local \
  --opt type=none \
  --opt device=/path/to/dir \
  --opt o=bind \
  my-volume
```

### List Volumes

```bash
# List all volumes
docker volume ls

# Filter by name
docker volume ls --filter name=website

# Show dangling volumes (not attached to containers)
docker volume ls --filter dangling=true
```

**Example output:**
```
DRIVER    VOLUME NAME
local     website-data
local     pgdata
local     redis-data
```

### Inspect Volume

```bash
docker volume inspect website-data
```

**Output:**
```json
[
    {
        "CreatedAt": "2025-11-15T10:30:00Z",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/website-data/_data",
        "Name": "website-data",
        "Options": null,
        "Scope": "local"
    }
]
```

**Get specific field:**
```bash
docker volume inspect website-data --format '{{ .Mountpoint }}'
# Output: /var/lib/docker/volumes/website-data/_data
```

### Access Volume Data

**Method 1: Direct access (Linux, requires sudo):**
```bash
sudo ls -la /var/lib/docker/volumes/website-data/_data
sudo cat /var/lib/docker/volumes/website-data/_data/index.html
```

**Method 2: Via running container:**
```bash
docker exec -it website-main ls /usr/share/nginx/html
docker exec -it website-main cat /usr/share/nginx/html/index.html
```

**Method 3: Temporary container:**
```bash
docker run --rm -it -v website-data:/data alpine sh
# Inside container
ls -la /data
cat /data/index.html
exit
```

**Method 4: Copy files:**
```bash
# Copy from container to host
docker cp website-main:/usr/share/nginx/html/index.html ./index.html

# Copy from host to container
docker cp ./myfile.html website-main:/usr/share/nginx/html/
```

### Remove Volume

**Remove specific volume:**
```bash
# Stop and remove container first
docker rm -f website-main

# Remove the volume
docker volume rm website-data
```

**Remove all unused volumes:**
```bash
docker volume prune

# With confirmation bypass
docker volume prune -f
```

**Remove container and its volumes:**
```bash
docker rm -v website-main
# Only removes volumes if no other containers use them
```

### Backup Volume

**Backup named volume to tar.gz:**
```bash
docker run --rm \
  -v website-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/website-data-backup.tar.gz -C /data .
```

**Restore from backup:**
```bash
docker run --rm \
  -v website-data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/website-data-backup.tar.gz"
```

### Share Volume Between Containers

**Container 1 (writer):**
```bash
docker run -d --name app1 -v shared-data:/data alpine sh -c "echo 'Hello from app1' > /data/message.txt && sleep 3600"
```

**Container 2 (reader):**
```bash
docker run --rm --name app2 -v shared-data:/data alpine cat /data/message.txt
# Output: Hello from app1
```

---

## Data Persistence

### What Happens When You Remove a Container?

**Named volumes:**
```bash
# Create container with volume
docker run -d --name test -v mydata:/data nginx

# Remove container
docker rm -f test

# Volume still exists!
docker volume ls | grep mydata
# Output: mydata

# Data is preserved
sudo ls /var/lib/docker/volumes/mydata/_data
```

**✅ Named volumes persist after container deletion**

**Bind mounts:**
```bash
# Create container with bind mount
docker run -d --name test -v /home/alex/data:/data nginx

# Remove container
docker rm -f test

# Host directory still exists!
ls /home/alex/data
```

**✅ Bind mount data stays on host**

**No volume:**
```bash
# Create container without volume
docker run -d --name test nginx
# Container writes to /var/log

# Remove container
docker rm -f test

# All data is deleted!
```

**❌ Container data is lost without volumes**

### Persistence Test

**Try it yourself:**
```bash
# 1. Create container with volume
docker run -d --name web -v testdata:/usr/share/nginx/html nginx:1.27.0

# 2. Create test file
docker exec web sh -c "echo 'Test data' > /usr/share/nginx/html/test.txt"

# 3. Verify file exists
docker exec web cat /usr/share/nginx/html/test.txt
# Output: Test data

# 4. Remove container
docker rm -f web

# 5. Check volume still exists
docker volume ls | grep testdata
# Output: testdata

# 6. Create new container with same volume
docker run -d --name web2 -v testdata:/usr/share/nginx/html nginx:1.27.0

# 7. Data is still there!
docker exec web2 cat /usr/share/nginx/html/test.txt
# Output: Test data

# 8. Cleanup
docker rm -f web2
docker volume rm testdata
```

---

## Best Practices

### ✅ Do's

1. **Use named volumes for production data**
   ```bash
   docker run -v pgdata:/var/lib/postgresql/data postgres
   ```

2. **Use bind mounts for development**
   ```bash
   docker run -v ./src:/app/src node:22-alpine
   ```

3. **Label your volumes**
   ```bash
   docker volume create --label project=myapp --label env=production mydata
   ```

4. **Backup important volumes regularly**
   ```bash
   # Daily backup cron job
   0 2 * * * docker run --rm -v pgdata:/data -v /backups:/backup alpine tar czf /backup/pgdata-$(date +\%Y\%m\%d).tar.gz -C /data .
   ```

5. **Use specific volume drivers when needed**
   ```bash
   # NFS volume
   docker volume create --driver local \
     --opt type=nfs \
     --opt o=addr=192.168.1.100,rw \
     --opt device=:/path/to/dir \
     nfs-volume
   ```

6. **Clean up unused volumes**
   ```bash
   # Weekly cleanup
   docker volume prune -f
   ```

### ❌ Don'ts

1. **Don't mount entire project directory (overwrites node_modules)**
   ```bash
   # ❌ Bad
   docker run -v .:/app node:22-alpine

   # ✅ Good
   docker run -v ./src:/app/src node:22-alpine
   ```

2. **Don't use anonymous volumes**
   ```bash
   # ❌ Bad (hard to manage)
   docker run -v /data nginx

   # ✅ Good (named and manageable)
   docker run -v mydata:/data nginx
   ```

3. **Don't delete volumes without backing up**
   ```bash
   # ❌ Bad (permanent data loss)
   docker volume rm pgdata

   # ✅ Good (backup first)
   docker run --rm -v pgdata:/data -v $(pwd):/backup alpine tar czf /backup/pgdata-backup.tar.gz -C /data .
   docker volume rm pgdata
   ```

4. **Don't use bind mounts for databases in production**
   ```bash
   # ❌ Bad (permission issues, slower)
   docker run -v /home/user/postgres:/var/lib/postgresql/data postgres

   # ✅ Good (Docker-managed, optimized)
   docker run -v pgdata:/var/lib/postgresql/data postgres
   ```

5. **Don't forget to document volume requirements**
   ```bash
   # ✅ Good - Add to docker-compose.yml
   volumes:
     - pgdata:/var/lib/postgresql/data  # PostgreSQL data directory
   ```

---

## Named Volume vs Bind Mount Comparison

| Feature | Named Volume | Bind Mount |
|---------|-------------|------------|
| **Syntax** | `-v name:/path` | `-v /host/path:/container/path` |
| **Storage** | `/var/lib/docker/volumes/` | Your specified path |
| **Management** | Docker | You |
| **Portability** | ✅ High | ⚠️ Medium |
| **Performance** | ✅ Fast | ✅ Fast (slower on Mac/Windows) |
| **Hot Reload** | ❌ No | ✅ Yes |
| **Production** | ✅ Recommended | ❌ Not recommended |
| **Development** | ⚠️ OK | ✅ Recommended |
| **Access** | Sudo or Docker | Direct |
| **Backup** | Docker commands | Regular file backup |
| **Sharing** | ✅ Easy | ⚠️ Harder |

---

## Volume Use Cases

### Development Environment

**React/Node.js with hot reload:**
```bash
docker run --rm -d -p 3000:3000 \
  -v ./src:/app/src \
  -v ./public:/app/public \
  react-app:dev
```

**Python Flask development:**
```bash
docker run --rm -d -p 5000:5000 \
  -v ./app:/code/app \
  -e FLASK_ENV=development \
  python-flask:dev
```

### Production Environment

**PostgreSQL database:**
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=secretpass \
  -v pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine
```

**Redis cache:**
```bash
docker run -d \
  --name redis \
  -v redis-data:/data \
  -p 6379:6379 \
  redis:7-alpine
```

**MongoDB:**
```bash
docker run -d \
  --name mongodb \
  -v mongodata:/data/db \
  -p 27017:27017 \
  mongo:7
```

### Static Website Hosting

**Nginx with content volume:**
```bash
docker run -d -p 3000:80 \
  --name website-main \
  -v website-data:/usr/share/nginx/html \
  nginx:1.27.0
```

---

## Troubleshooting

### Volume Permission Issues

**Problem:** Permission denied when accessing files

**Solution 1: Check file ownership**
```bash
sudo ls -la /var/lib/docker/volumes/mydata/_data
```

**Solution 2: Fix permissions**
```bash
sudo chown -R 1000:1000 /var/lib/docker/volumes/mydata/_data
```

**Solution 3: Use --chown in COPY**
```dockerfile
COPY --chown=user:user --from=builder /app/dist /usr/share/nginx/html
```

### Volume Not Found

**Problem:** Volume doesn't exist

**Check if volume exists:**
```bash
docker volume ls | grep myvolume
```

**Create volume:**
```bash
docker volume create myvolume
```

### Data Not Persisting

**Problem:** Data disappears when container restarts

**Check mount type:**
```bash
docker inspect <container> | grep -A 20 "Mounts"
```

**Verify volume is mounted:**
```bash
# Should show Type: "volume" or "bind"
```

### Slow Performance (macOS/Windows)

**Problem:** Volume mounts are slow

**Solution: Use named volumes instead of bind mounts**
```bash
# Slower (bind mount)
docker run -v ./data:/app/data myapp

# Faster (named volume)
docker run -v mydata:/app/data myapp
```

### Cannot Delete Volume

**Problem:** Volume is in use

**Find containers using volume:**
```bash
docker ps -a --filter volume=myvolume
```

**Remove containers first:**
```bash
docker rm -f <container-id>
docker volume rm myvolume
```

---

## Quick Reference Commands

```bash
# Create volume
docker volume create <name>

# List volumes
docker volume ls

# Inspect volume
docker volume inspect <name>

# Remove volume
docker volume rm <name>

# Remove all unused volumes
docker volume prune

# Get volume location
docker volume inspect <name> --format '{{ .Mountpoint }}'

# Backup volume
docker run --rm -v <volume>:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .

# Restore volume
docker run --rm -v <volume>:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/backup.tar.gz"

# Copy from volume to host
docker cp <container>:/path/in/container ./local/path

# Copy from host to volume
docker cp ./local/path <container>:/path/in/container

# View volume contents
docker run --rm -v <volume>:/data alpine ls -la /data
```

---

## Real Session Examples

These examples were executed in this environment:

### Example 1: Nginx Website

```bash
# Create and run
docker run -d -p 3000:80 --name website-main -v website-data:/usr/share/nginx/html nginx:1.27.0

# Inspect storage location
docker volume inspect website-data --format '{{ .Mountpoint }}'
# Output: /var/lib/docker/volumes/website-data/_data

# View files
sudo ls -la /var/lib/docker/volumes/website-data/_data

# Access via container
docker exec -it website-main ls /usr/share/nginx/html
```

### Example 2: React Development

```bash
# Run with hot reload
docker run --rm -d -p 3000:3000 \
  -v ./public:/app/public \
  -v ./src:/app/src \
  react-app:dev

# Edit files on host
vim /home/alex/docker/my-react-app/src/App.js

# Changes reflect immediately in browser
```

---

## Additional Resources

- [Docker Volumes Documentation](https://docs.docker.com/storage/volumes/)
- [Docker Storage Overview](https://docs.docker.com/storage/)
- [Volume Plugins](https://docs.docker.com/engine/extend/plugins_volume/)
- [Bind Mounts](https://docs.docker.com/storage/bind-mounts/)

---

## Summary

**Key Takeaways:**

1. **Named volumes** for production data (databases, important files)
2. **Bind mounts** for development (hot reload, direct access)
3. **Volumes persist** after container deletion
4. **Always backup** important volume data
5. **Use docker volume commands** to manage volumes
6. **Named volumes are stored** in `/var/lib/docker/volumes/` on Linux

**Volume Decision Tree:**

```
Need persistent data?
├── Yes, production database/app data
│   └── Use named volume (-v volumename:/path)
├── Yes, development with hot reload
│   └── Use bind mount (-v ./localpath:/path)
└── No, temporary data
    └── No volume needed
```
