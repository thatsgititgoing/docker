# Docker Multi-Stage Build for TypeScript Express Application

This repository demonstrates an advanced **3-stage multi-stage build** for a TypeScript Express.js application using Google's Distroless base image for maximum security and minimal size.

## 📁 Project Structure

```
multistage-builds/
├── Dockerfile              # 3-stage Docker build configuration
├── .dockerignore          # Files excluded from Docker build context
├── package.json           # Node.js dependencies and build scripts
├── package-lock.json      # Locked dependency versions
├── tsconfig.json          # TypeScript compiler configuration
├── src/                   # TypeScript source code
│   └── index.ts           # Express application entry point
└── dist/                  # Compiled JavaScript output (generated)
```

## 🐳 Dockerfile Architecture

This project uses an advanced **3-stage multi-stage build** pattern optimized for Node.js production deployments.

### Stage 1: Build (Compile TypeScript)

**Base Image:** `node:22-alpine`

**Purpose:** Compile TypeScript to JavaScript

**Steps:**
1. Sets working directory to `/app`
2. Copies `package*.json` for dependency resolution
3. Installs ALL dependencies (including devDependencies for TypeScript compiler)
4. Copies source code and TypeScript config
5. Compiles TypeScript using `npm run build`

**Output:** Compiled JavaScript in `/app/dist`

### Stage 2: Dependencies (Production Only)

**Base Image:** `node:22-alpine`

**Purpose:** Install only production dependencies (no TypeScript, no dev tools)

**Steps:**
1. Sets working directory to `/app`
2. Copies `package*.json`
3. Installs ONLY production dependencies with `npm ci --only=production`

**Output:** Minimal `/app/node_modules` with production packages only

**Why Separate?** This ensures devDependencies (TypeScript, @types packages) are excluded from the final image.

### Stage 3: Runner (Distroless)

**Base Image:** `gcr.io/distroless/nodejs22`

**Purpose:** Ultra-minimal runtime environment

**Steps:**
1. Sets working directory to `/app`
2. Copies production `node_modules` from Stage 2
3. Copies compiled JavaScript from Stage 1
4. Sets environment variable `PORT=3000`
5. Runs the compiled application

**Security Features:**
- **Distroless** - No shell, no package manager, no OS utilities
- **Minimal attack surface** - Only Node.js runtime + your app
- **Extremely small** - ~100 MB vs 300-500 MB for standard images
- **No root access needed** - Runs as non-root by default

## 📄 File Explanations

### Dockerfile

**Stage 1: Build**

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY src src
COPY tsconfig.json tsconfig.json
RUN npm run build
```

**Key Points:**
- `npm ci` installs from lockfile (reproducible builds)
- Copies only necessary files for compilation
- Separates dependency install from source copy (better caching)
- Output: JavaScript in `/app/dist`

**Stage 2: Dependencies**

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
```

**Key Points:**
- `--only=production` excludes devDependencies
- Separate stage prevents TypeScript compiler in final image
- Smaller node_modules (50-80% size reduction)

**Stage 3: Runner**

```dockerfile
FROM gcr.io/distroless/nodejs22
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=build /app/dist dist
ENV PORT=3000
CMD [ "dist/index.js" ]
```

**Key Points:**
- **Distroless** = No shell, no apt, no package manager
- Copies ONLY production dependencies + compiled code
- Sets default PORT environment variable
- CMD runs the compiled JavaScript directly

**Security Advantage:** Attackers cannot execute shell commands even if they compromise the application.

### .dockerignore

```
node_modules     # Local dependencies (rebuilt in container)
dist             # Previous build artifacts
```

**Purpose:**
- Excludes local build artifacts
- Prevents cache invalidation
- Faster context transfer to Docker daemon

### tsconfig.json

TypeScript compiler configuration determining how `.ts` files compile to `.js`.

**Key Settings:**
- `outDir`: Specifies output directory (usually `dist/`)
- `target`: JavaScript version (ES2020+)
- `module`: Module system (CommonJS for Node.js)

## 🚀 How to Use

### Prerequisites

- Docker 20.10+
- Git

### Step 1: Build the Docker Image

```bash
# Navigate to project directory
cd /home/alex/docker/multistage-builds

# Build the image
docker build -t express-ts:latest .

# Build with specific tag
docker build -t express-ts:1.0.0 .
```

**Build Process:**
1. Stage 1: Compiles TypeScript (~30-60 seconds)
2. Stage 2: Installs production deps (~10-20 seconds)
3. Stage 3: Assembles final distroless image (~5 seconds)

**Expected Output:**
- Total build time: 1-2 minutes (first time)
- Cached builds: 10-30 seconds
- Final image size: ~100-120 MB

### Step 2: Run the Container

```bash
# Run on port 3000
docker run -d -p 3000:3000 --name express-app express-ts:latest

# Run with custom port
docker run -d -p 8080:3000 --name express-app express-ts:latest

# Run with environment variables
docker run -d -p 3000:3000 -e PORT=3000 -e NODE_ENV=production --name express-app express-ts:latest

# Run in foreground (see logs)
docker run -p 3000:3000 express-ts:latest
```

**Port Configuration:**
- Default container port: **3000** (from ENV PORT=3000)
- Override with `-e PORT=8080`

### Step 3: Test the Application

```bash
# Check if running
docker ps

# Test endpoint
curl http://localhost:3000

# View logs
docker logs express-app

# Follow logs
docker logs -f express-app
```

### Step 4: Stop and Clean Up

```bash
# Stop container
docker stop express-app

# Remove container
docker rm express-app

# Remove image
docker rmi express-ts:latest
```

## 🔧 Advanced Usage

### Debugging Distroless Images

**Problem:** Distroless images have no shell, so `docker exec` doesn't work.

**Solution 1: Debug variant**

```dockerfile
# Temporarily use debug variant
FROM gcr.io/distroless/nodejs22:debug AS runner
```

Debug variant includes busybox shell:

```bash
docker run -it express-ts:debug /busybox/sh
```

**Solution 2: Multi-stage inspection**

```bash
# Build and inspect intermediate stages
docker build --target build -t express-ts:build .
docker run -it express-ts:build /bin/sh

docker build --target deps -t express-ts:deps .
docker run -it express-ts:deps /bin/sh
```

### View Compiled Output

```bash
# Build to build stage
docker build --target build -t express-ts:build .

# Exec into build stage
docker run --rm -it express-ts:build /bin/sh

# Inside container
ls -la /app/dist
cat /app/dist/index.js
```

### Compare Stage Sizes

```bash
# Build all stages
docker build --target build -t express-ts:build .
docker build --target deps -t express-ts:deps .
docker build -t express-ts:final .

# Check sizes
docker images | grep express-ts
```

**Expected Sizes:**
- `express-ts:build` - ~300-400 MB (Node + TypeScript + all deps)
- `express-ts:deps` - ~200-300 MB (Node + production deps only)
- `express-ts:final` - ~100-120 MB (Distroless + app)

### Local Development

**Without Docker:**

```bash
# Install dependencies
npm install

# Run TypeScript compiler in watch mode
npm run build -- --watch

# In another terminal, run with nodemon
npm install -g nodemon
nodemon dist/index.js
```

**With Docker Compose:**

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

## 🔒 Security Features

This multi-stage build provides **enterprise-grade security**:

### ✅ Implemented

1. **Distroless base image**
   - No shell (/bin/sh doesn't exist)
   - No package manager (apt, apk unavailable)
   - Only Node.js runtime + application
   - Prevents post-compromise lateral movement

2. **Multi-stage isolation**
   - Build tools isolated from runtime
   - TypeScript compiler not in final image
   - Development dependencies excluded

3. **Minimal dependencies**
   - Only production npm packages
   - No @types packages
   - No TypeScript or build tools

4. **Small attack surface**
   - ~100 MB image (vs 300-500 MB standard)
   - Fewer packages = fewer vulnerabilities
   - No unnecessary binaries

5. **Reproducible builds**
   - `npm ci` uses lockfile
   - Deterministic dependency versions

6. **Non-root execution** (Distroless default)
   - Runs as unprivileged user
   - No sudo or privilege escalation

### 🎯 Security Best Practices

**Image Scanning:**

```bash
# Scan with Docker Scout
docker scout cves express-ts:latest

# Scan with Trivy
trivy image express-ts:latest

# Scan with Snyk
snyk container test express-ts:latest
```

**Runtime Security:**

```bash
# Run with read-only filesystem
docker run --read-only -p 3000:3000 express-ts:latest

# Drop all capabilities
docker run --cap-drop=ALL -p 3000:3000 express-ts:latest

# Limit resources
docker run --memory=128m --cpus=0.5 -p 3000:3000 express-ts:latest
```

## 🚀 Why 3-Stage Build?

### Comparison: Single vs Multi-Stage

**Single Stage (Traditional):**

```dockerfile
FROM node:22
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "dist/index.js"]
```

**Problems:**
- Final image: ~500 MB
- Includes TypeScript compiler
- Contains devDependencies
- Has shell and package manager
- Larger attack surface

**3-Stage Build (This Project):**

**Benefits:**
- Final image: ~100 MB (80% smaller)
- No build tools in production
- No devDependencies
- No shell (Distroless)
- Minimal attack surface

### Build Stage Purposes

| Stage | Purpose | Base Image | Output |
|-------|---------|------------|--------|
| Build | Compile TS → JS | node:22-alpine | `/app/dist` |
| Deps | Production deps only | node:22-alpine | `/app/node_modules` |
| Runner | Minimal runtime | distroless/nodejs22 | Final image |

## ☸️ Kubernetes Deployment

### Push to Registry

```bash
# Tag for registry
docker tag express-ts:latest yourusername/express-ts:1.0.0

# Push
docker push yourusername/express-ts:1.0.0
```

### Sample Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: express-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: express-app
  template:
    metadata:
      labels:
        app: express-app
    spec:
      containers:
      - name: express-app
        image: yourusername/express-ts:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
---
apiVersion: v1
kind: Service
metadata:
  name: express-service
spec:
  type: LoadBalancer
  selector:
    app: express-app
  ports:
  - port: 80
    targetPort: 3000
```

### Deploy

```bash
kubectl apply -f deployment.yaml
kubectl get pods
kubectl logs -l app=express-app
```

## 🛠️ Troubleshooting

### Cannot exec into distroless container

**Issue:** `docker exec -it express-app /bin/sh` fails

**Reason:** Distroless images have no shell

**Solution:**
```dockerfile
# Use debug variant temporarily
FROM gcr.io/distroless/nodejs22:debug
```

Or inspect intermediate stages:
```bash
docker build --target build -t express-ts:build .
docker run -it express-ts:build /bin/sh
```

### Module not found errors

**Issue:** `Cannot find module 'express'`

**Reason:** Production dependencies not installed correctly

**Solution:**
```bash
# Check deps stage
docker build --target deps -t express-ts:deps .
docker run -it express-ts:deps /bin/sh
ls -la /app/node_modules
```

### TypeScript compilation fails

**Issue:** Build stage fails with TypeScript errors

**Solution:**
```bash
# Test locally first
npm install
npm run build

# Check for errors
npx tsc --noEmit
```

### Port binding issues

**Issue:** Cannot access application on localhost

**Solution:**
```bash
# Verify container is running
docker ps

# Check logs for errors
docker logs express-app

# Ensure correct port mapping
docker run -p 3000:3000 express-ts  # Host:Container
```

## 📊 Performance Metrics

**Image Sizes:**
- Build stage: ~400 MB (discarded)
- Deps stage: ~250 MB (discarded)
- Final image: ~110 MB

**Build Times:**
- First build: 1-2 minutes
- Cached build (code change): 10-20 seconds
- Cached build (no changes): 1-3 seconds

**Runtime Performance:**
- Memory usage: ~30-50 MB
- Startup time: <500ms
- CPU usage: <1% idle

## 📚 References

- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Google Distroless Images](https://github.com/GoogleContainerTools/distroless)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🎓 Key Takeaways

1. **Multi-stage builds reduce image size by 60-80%**
2. **Distroless images eliminate shell-based attacks**
3. **Separating dependencies and build outputs improves security**
4. **Caching strategies significantly speed up builds**
5. **Production images should never include build tools**

## 📝 License

This is a reference implementation for educational purposes.
