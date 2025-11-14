# Docker Image Optimization Techniques

This repository demonstrates various Docker image optimization strategies for Node.js applications. It contains three different Dockerfile variations showcasing different optimization approaches, from basic to advanced.

## 📁 Project Structure

```
optimizing-images/
├── Dockerfile.size        # Optimized for small image size (Alpine Linux)
├── Dockerfile.order       # Demonstrates poor layer caching
├── Dockerfile.deps        # Optimized for caching + production dependencies
├── .dockerignore         # Excludes files from build context
├── index.js              # Simple Express.js application
├── package.json          # Dependencies (express + devDependencies)
└── package-lock.json     # Locked dependency versions
```

## 📦 Application Overview

This is a simple Express.js server that demonstrates optimization concepts:

**index.js:**
```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.listen(3000, () => {
  console.log('Listening on port:3000');
});
```

**Dependencies:**
- **Production:** `express` (4.19.2)
- **Development:** `@types/express`, `jest`, `typescript`

## 🐳 Dockerfile Variations Explained

### 1. Dockerfile.size - Image Size Optimization

**File:** `Dockerfile.size`

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY index.js index.js

CMD [ "node", "index.js" ]
```

**Optimization Strategy:** **Alpine Linux Base**

**Key Features:**
- ✅ Uses `node:22-alpine` instead of `node:22`
- ✅ Alpine Linux is minimal (~5 MB base vs 100+ MB)
- ✅ Separates dependency installation from source copy
- ✅ Leverages Docker layer caching

**Image Size:**
- Standard Node.js: ~900-1000 MB
- Alpine Node.js: ~150-200 MB
- **Reduction: ~80-85%**

**When to Use:**
- Production deployments where size matters
- Container orchestration (Kubernetes) with many replicas
- Limited storage or bandwidth environments

**Trade-offs:**
- Alpine uses `musl libc` instead of `glibc` (rare compatibility issues)
- Some native modules may need rebuild
- Slightly slower build times for first-time setup

---

### 2. Dockerfile.order - Poor Caching Example

**File:** `Dockerfile.order`

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm ci

CMD [ "node", "index.js" ]
```

**Optimization Strategy:** **NONE - Anti-pattern demonstration**

**Problems:**
- ❌ Copies ALL files before installing dependencies
- ❌ Cache invalidation on ANY file change (even README edits)
- ❌ Re-installs node_modules on every code change
- ❌ Slow builds (must reinstall deps every time)

**Why This is Bad:**

```
Change index.js → COPY . . invalidates → npm ci runs again (1-2 min)
Change README.md → COPY . . invalidates → npm ci runs again (1-2 min)
```

**Build Time:**
- First build: 1-2 minutes
- Every subsequent build: 1-2 minutes ❌

**What Docker Does:**
1. Detects change in source code
2. Invalidates `COPY . .` layer
3. Re-executes all subsequent layers (including `npm ci`)
4. Wastes time reinstalling unchanged dependencies

**Lesson:** Never copy source code before installing dependencies.

---

### 3. Dockerfile.deps - Optimal Configuration

**File:** `Dockerfile.deps`

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json .

RUN npm ci --only=production

COPY index.js index.js

CMD [ "node", "index.js" ]
```

**Optimization Strategy:** **Layer Caching + Production Dependencies**

**Key Features:**
- ✅ Alpine Linux base (small size)
- ✅ Copies `package*.json` FIRST (optimal caching)
- ✅ `npm ci --only=production` (excludes devDependencies)
- ✅ Copies source code AFTER dependencies
- ✅ Fast rebuilds when only code changes

**Why This is Optimal:**

```
Change index.js → Only COPY index.js layer rebuilds → 5-10 seconds ✅
Change package.json → npm ci runs → 1-2 minutes (expected)
No changes → All layers cached → 1-3 seconds ✅
```

**Image Size Comparison:**

| Variation | All Dependencies | Production Only | Savings |
|-----------|------------------|-----------------|---------|
| Dependencies | ~180 MB | ~150 MB | 30 MB |
| node_modules | 45 MB | 10 MB | 35 MB |

**Build Time:**
- First build: 1-2 minutes
- Code change: 5-10 seconds ✅
- No changes: 1-3 seconds ✅

**Production Benefits:**
- Smaller images (30-50% reduction in dependencies)
- No testing frameworks (jest) in production
- No TypeScript compiler in production
- Faster deployments
- Reduced attack surface

---

## 📄 File Explanations

### .dockerignore

```
node_modules
```

**Purpose:** Excludes local `node_modules` from Docker build context

**Why Important:**
- Prevents copying host system's node_modules (might be different OS/architecture)
- Reduces build context size (faster uploads to Docker daemon)
- Avoids cache invalidation from local dependency changes
- Ensures clean, reproducible builds

**Without .dockerignore:**
- Build context: 50-100 MB
- Context transfer time: 5-10 seconds

**With .dockerignore:**
- Build context: 1-5 MB
- Context transfer time: <1 second

### package.json

Contains both production and development dependencies:

**Production (needed at runtime):**
```json
"dependencies": {
  "express": "4.19.2"
}
```

**Development (only needed for building/testing):**
```json
"devDependencies": {
  "@types/express": "4.17.21",  # TypeScript types
  "jest": "29.7.0",              # Testing framework
  "typescript": "5.5.3"          # TypeScript compiler
}
```

**Key Point:** `npm ci --only=production` installs ONLY dependencies, excluding devDependencies.

---

## 🚀 How to Use

### Prerequisites

- Docker 20.10+
- Basic understanding of Docker concepts

### Compare All Three Approaches

#### 1. Build with Dockerfile.size (Alpine Linux)

```bash
cd /home/alex/docker/optimizing-images

# Build
docker build -f Dockerfile.size -t optimize:size .

# Check size
docker images optimize:size

# Run
docker run -d -p 3000:3000 --name app-size optimize:size

# Test
curl http://localhost:3000
```

**Expected:** ~150-200 MB image

#### 2. Build with Dockerfile.order (Poor Caching)

```bash
# Build first time
docker build -f Dockerfile.order -t optimize:order .

# Make a small change
echo "// comment" >> index.js

# Build again (watch it reinstall dependencies)
docker build -f Dockerfile.order -t optimize:order .
```

**Observe:** npm ci runs again even though dependencies didn't change ❌

#### 3. Build with Dockerfile.deps (Optimal)

```bash
# Build first time
docker build -f Dockerfile.deps -t optimize:deps .

# Make a small change
echo "// comment" >> index.js

# Build again (fast!)
docker build -f Dockerfile.deps -t optimize:deps .
```

**Observe:** npm ci layer is cached, only code layer rebuilds ✅

### Side-by-Side Comparison

```bash
# Build all three
docker build -f Dockerfile.size -t optimize:size .
docker build -f Dockerfile.order -t optimize:order .
docker build -f Dockerfile.deps -t optimize:deps .

# Compare sizes
docker images | grep optimize

# Expected output:
# optimize:deps   ~150 MB (smallest - production deps only)
# optimize:size   ~180 MB (Alpine with all deps)
# optimize:order  ~180 MB (Alpine with all deps)
```

### Measure Build Performance

**Test caching effectiveness:**

```bash
# 1. Clean build (no cache)
docker build --no-cache -f Dockerfile.deps -t optimize:deps .
# Time: ~1-2 minutes

# 2. No changes (full cache)
docker build -f Dockerfile.deps -t optimize:deps .
# Time: ~1-3 seconds ✅

# 3. Code change only
echo "// test" >> index.js
docker build -f Dockerfile.deps -t optimize:deps .
# Time: ~5-10 seconds ✅

# 4. Dependency change
# Edit package.json to add a dependency
docker build -f Dockerfile.deps -t optimize:deps .
# Time: ~1-2 minutes (expected - must reinstall)
```

### Run and Test

```bash
# Run the optimized version
docker run -d -p 3000:3000 --name express-app optimize:deps

# Test endpoint
curl http://localhost:3000
# Output: Hello from Express!

# Check logs
docker logs express-app
# Output: Listening on port:3000

# Stop and remove
docker stop express-app
docker rm express-app
```

---

## 🎯 Optimization Principles

### 1. Use Alpine Linux Base Images

**Standard vs Alpine:**

```dockerfile
# Standard (large but compatible)
FROM node:22
# Size: ~900 MB

# Alpine (small but minimal)
FROM node:22-alpine
# Size: ~150 MB
```

**When to use Alpine:**
- ✅ Production deployments
- ✅ Microservices
- ✅ Cloud deployments (bandwidth costs)
- ✅ Container orchestration

**When to use Standard:**
- ⚠️ Native modules with complex compilation
- ⚠️ Need glibc specifically
- ⚠️ Development environments

### 2. Optimize Layer Caching

**❌ Bad (invalidates cache on any change):**

```dockerfile
COPY . .
RUN npm ci
```

**✅ Good (caches dependencies separately):**

```dockerfile
COPY package*.json .
RUN npm ci
COPY . .
```

**Why?**
- Docker caches each layer (RUN, COPY, etc.)
- When a layer changes, all subsequent layers rebuild
- Package files change less frequently than source code
- Copying package files first preserves npm ci cache

### 3. Use Production Dependencies Only

**Development (large):**

```dockerfile
RUN npm ci
# Installs: express + jest + typescript + @types/*
# Size: ~45 MB node_modules
```

**Production (small):**

```dockerfile
RUN npm ci --only=production
# Installs: express only
# Size: ~10 MB node_modules
```

**Savings:** 35 MB + faster installs + smaller attack surface

### 4. Use .dockerignore

**Without .dockerignore:**
```
Building context... 50 MB (including node_modules)
Transferring context to Docker daemon... 5 seconds
```

**With .dockerignore:**
```
Building context... 2 MB (excluding node_modules)
Transferring context to Docker daemon... <1 second
```

### 5. Order Matters

**Optimal Dockerfile Structure:**

```dockerfile
# 1. Base image (changes rarely)
FROM node:22-alpine

# 2. Set working directory (changes rarely)
WORKDIR /app

# 3. Copy dependency manifests (changes occasionally)
COPY package*.json ./

# 4. Install dependencies (changes occasionally)
RUN npm ci --only=production

# 5. Copy source code (changes frequently)
COPY . .

# 6. Define runtime (changes rarely)
CMD ["node", "index.js"]
```

**Principle:** Place less frequently changing layers FIRST to maximize cache hits.

---

## 📊 Performance Comparison

### Build Time Comparison

| Scenario | Dockerfile.order | Dockerfile.deps | Time Saved |
|----------|-----------------|-----------------|------------|
| First build | 90 seconds | 90 seconds | 0 seconds |
| Code change | 90 seconds ❌ | 8 seconds ✅ | 82 seconds |
| No change | 2 seconds | 2 seconds | 0 seconds |
| Dependency change | 90 seconds | 90 seconds | 0 seconds |

**Typical development:** 10-20 code changes per day = **Save 13-27 minutes daily** ⏱️

### Image Size Comparison

| Configuration | Size | Use Case |
|--------------|------|----------|
| node:22 (standard) | ~950 MB | Development |
| node:22-alpine | ~180 MB | Basic production |
| node:22-alpine + prod deps | ~150 MB | Optimized production |
| Multi-stage + distroless | ~100 MB | Maximum optimization |

---

## 🔍 Inspect and Debug

### View Image Layers

```bash
# See layer history
docker history optimize:deps

# Example output:
# IMAGE          CREATED         SIZE
# abc123         2 minutes ago   10 MB   COPY index.js
# def456         5 minutes ago   45 MB   RUN npm ci
# ghi789         5 minutes ago   1 KB    COPY package*.json
```

### Compare Layer Caching

**Dockerfile.order (poor caching):**

```bash
docker build -f Dockerfile.order -t optimize:order .
# Change index.js
echo "// test" >> index.js
docker build -f Dockerfile.order -t optimize:order .
```

**Watch output:**
```
Step 3/5 : COPY . .
 ---> Running in abc123 (REBUILDS)
Step 4/5 : RUN npm ci
 ---> Running in def456 (REINSTALLS - SLOW) ❌
```

**Dockerfile.deps (good caching):**

```bash
docker build -f Dockerfile.deps -t optimize:deps .
# Change index.js
echo "// test" >> index.js
docker build -f Dockerfile.deps -t optimize:deps .
```

**Watch output:**
```
Step 3/6 : COPY package*.json .
 ---> Using cache (CACHED) ✅
Step 4/6 : RUN npm ci
 ---> Using cache (CACHED) ✅
Step 5/6 : COPY index.js index.js
 ---> Running in abc123 (REBUILDS ONLY THIS)
```

### Inspect node_modules Size

```bash
# Build with all dependencies
docker build -f Dockerfile.size -t optimize:size .

# Build with production only
docker build -f Dockerfile.deps -t optimize:deps .

# Compare node_modules size
docker run --rm optimize:size du -sh /app/node_modules
# Output: 45M

docker run --rm optimize:deps du -sh /app/node_modules
# Output: 10M
```

---

## 🎓 Key Takeaways

### ✅ Do's

1. **Use Alpine images** for production (node:22-alpine)
2. **Copy package files first**, then install, then copy source
3. **Use `npm ci --only=production`** for production builds
4. **Add .dockerignore** to exclude node_modules
5. **Order layers** from least to most frequently changing
6. **Use specific versions** in FROM statements (node:22, not node:latest)

### ❌ Don'ts

1. **Don't `COPY . .` before installing dependencies** (breaks caching)
2. **Don't include devDependencies** in production images
3. **Don't forget .dockerignore** (slow builds, large contexts)
4. **Don't use :latest tags** (unpredictable, non-reproducible)
5. **Don't copy node_modules** from host (use npm ci in container)

### 🎯 Best Practice Dockerfile Template

```dockerfile
# Use Alpine for size
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests FIRST (caching)
COPY package*.json ./

# Install PRODUCTION dependencies only
RUN npm ci --only=production

# Copy application source LAST (changes frequently)
COPY . .

# Expose port (documentation)
EXPOSE 3000

# Run application
CMD ["node", "index.js"]
```

---

## 🚀 Advanced Optimization

For even better optimization, consider:

### Multi-Stage Builds

Separate build and runtime stages:

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

### Distroless Images

Use Google's distroless for ultimate security:

```dockerfile
FROM gcr.io/distroless/nodejs22
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
CMD ["dist/index.js"]
```

See [../multistage-builds/README.md](../multistage-builds/README.md) for complete multi-stage examples.

---

## 📚 References

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Docker Layer Caching](https://docs.docker.com/build/cache/)
- [Alpine Linux Docker](https://hub.docker.com/_/alpine)

## 📝 Summary

This repository demonstrates three critical Docker optimization techniques:

1. **Image Size** - Use Alpine Linux to reduce image size by 80%
2. **Layer Caching** - Order Dockerfile commands to maximize cache hits
3. **Dependency Optimization** - Use production-only dependencies to reduce size and attack surface

**Impact:**
- 80-85% smaller images
- 90% faster rebuilds during development
- 30-50% fewer dependencies in production
- More secure, production-ready containers

---

## 📝 License

This is a reference implementation for educational purposes.
