# Hello from Node - Docker Build Context

This project demonstrates Docker build optimization using `.dockerignore` to exclude test files from the production image.

## Directory Structure

```
build-context/
├── Dockerfile           # Container build instructions
├── .dockerignore        # Files to exclude from Docker build
├── index.js             # Main application entry point
├── README.md            # This documentation
└── src/
    ├── component1/
    │   ├── component1.js       # Component 1 source
    │   └── component1.test.js  # Component 1 tests (excluded)
    └── component2/
        ├── component2.js         # Component 2 source
        ├── component2 copy.js    # Component 2 backup
        ├── component2.test.js    # Component 2 tests (excluded)
        └── component2.test copy.js  # Component 2 test backup (excluded)
```

---

## File Details

### 1. Dockerfile

**Purpose**: Defines the Node.js container image build process.

**Content**:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
CMD [ "node", "index.js" ]
```

**Instructions Breakdown**:

```dockerfile
FROM node:22-alpine
```
- **Base Image**: Official Node.js v22 on Alpine Linux (lightweight ~50MB)
- **Links to**: Docker Hub `node:22-alpine` image

```dockerfile
WORKDIR /app
```
- **Sets working directory** to `/app` inside the container
- All subsequent commands run from this directory
- Files are copied here by default

```dockerfile
COPY . .
```
- **Source** (first `.`): Everything in `/home/alex/docker/build-context/` (filtered by `.dockerignore`)
- **Destination** (second `.`): Current working directory (`/app`) in container
- **Applies `.dockerignore` rules** - test files are excluded here

```dockerfile
CMD [ "node", "index.js" ]
```
- **Default command** when container starts
- Runs `node index.js` from `/app` directory
- **Links to**: [index.js](index.js)

---

### 2. .dockerignore

**Purpose**: Excludes files from the Docker build context to reduce image size and improve build speed.

**Content**:
```
**/*.test.js
```

**Pattern Explanation**:
- `**/` - Match in any directory (recursive)
- `*.test.js` - Any file ending with `.test.js`

**Files Excluded** (won't appear in container):
- ❌ `src/component1/component1.test.js`
- ❌ `src/component2/component2.test.js`
- ❌ `src/component2/component2.test copy.js`

**Files Included** (will be in container):
- ✅ `Dockerfile`
- ✅ `.dockerignore`
- ✅ `index.js`
- ✅ `src/component1/component1.js`
- ✅ `src/component2/component2.js`
- ✅ `src/component2/component2 copy.js`

**How It Works**:
1. When `COPY . .` executes in [Dockerfile](Dockerfile:5), Docker reads `.dockerignore`
2. Files matching `**/*.test.js` are filtered out before copying
3. Only non-test files make it into the container image
4. Test files never exist in the final image (even if you exec into the container)

---

### 3. index.js

**Purpose**: Main application entry point.

**Content**:
```javascript
console.log("Hello from build-context/index.js");
```

**Connection to Dockerfile**:
- **Copied** from host to `/app/index.js` in container (line 5 of Dockerfile)
- **Executed** when container starts via `CMD [ "node", "index.js" ]` (line 7 of Dockerfile)

---

### 4. src/ Directory

**Purpose**: Contains application components and their test files.

**Structure**:
- `component1/` - Component 1 module
- `component2/` - Component 2 module

**Component Files**:
- `.js` files (source code) - ✅ **Included** in container
- `.test.js` files (unit tests) - ❌ **Excluded** by `.dockerignore`

**Why Exclude Tests**:
- **Smaller image size** - Test files aren't needed in production
- **Faster builds** - Less data to transfer to Docker daemon
- **Security** - Don't ship test data/fixtures to production
- **Clean separation** - Development files stay in development

---

## How Files Link Together

### Build Process Flow

```
1. Docker Build Command
   └─> docker build -t hello-from-node .

2. Dockerfile (line 2)
   └─> FROM node:22-alpine
       └─> Pulls base image from Docker Hub

3. Dockerfile (line 4)
   └─> WORKDIR /app
       └─> Sets working directory in container

4. .dockerignore + Dockerfile (line 5)
   └─> COPY . .
       ├─> Reads .dockerignore
       ├─> Filters out **/*.test.js files
       └─> Copies remaining files to /app

   Files Copied:
   ✅ index.js                    → /app/index.js
   ✅ src/component1/component1.js → /app/src/component1/component1.js
   ✅ src/component2/component2.js → /app/src/component2/component2.js

   Files Excluded:
   ❌ src/component1/component1.test.js (filtered by .dockerignore)
   ❌ src/component2/component2.test.js (filtered by .dockerignore)

5. Dockerfile (line 7)
   └─> CMD [ "node", "index.js" ]
       └─> Sets default startup command
```

### Runtime Flow

```
1. Container starts
   └─> Executes: node index.js

2. Node.js runs /app/index.js
   └─> Outputs: "Hello from build-context/index.js"

3. Container continues running or exits (depending on how it's started)
```

---

## File Dependencies Diagram

```
┌─────────────────┐
│   .dockerignore │
│  **/*.test.js   │
└────────┬────────┘
         │ (filters)
         ▼
┌─────────────────────────────────────────────┐
│              Dockerfile                     │
├─────────────────────────────────────────────┤
│ FROM node:22-alpine                         │
│ WORKDIR /app                                │
│ COPY . .  ◄─── Applies .dockerignore filter │
│ CMD ["node", "index.js"]                    │
└────────┬────────────────────────────────────┘
         │
         ├─── Copies: index.js ────────────────┐
         ├─── Copies: src/component1/*.js ────┐│
         └─── Copies: src/component2/*.js ───┐││
                                              │││
                      ▼                       │││
              Container Image                 │││
              /app/                           │││
              ├── index.js  ◄─────────────────┘││
              └── src/                         ││
                  ├── component1/              ││
                  │   └── component1.js  ◄─────┘│
                  └── component2/               │
                      ├── component2.js  ◄──────┘
                      └── component2 copy.js
```

---

## Usage

### Build the Image

```bash
cd /home/alex/docker/build-context
docker build -t hello-from-node .
```

**What happens**:
- Docker reads [Dockerfile](Dockerfile)
- Pulls `node:22-alpine` base image
- Reads [.dockerignore](.dockerignore) to filter files
- Copies files (excluding `*.test.js`) to `/app`
- Creates image tagged `hello-from-node`

### Run the Container

**Option 1: Run and see output**
```bash
docker run --rm hello-from-node
# Output: Hello from build-context/index.js
```

**Option 2: Run in background for inspection**
```bash
docker run -d --name hello-app hello-from-node sleep infinity
```

### Verify .dockerignore Exclusions

**Check what files made it into the container**:
```bash
docker run --rm hello-from-node find /app -type f
```

**Expected output**:
```
/app/Dockerfile
/app/.dockerignore
/app/index.js
/app/src/component1/component1.js
/app/src/component2/component2.js
/app/src/component2/component2 copy.js
```

**Notice**: No `.test.js` files appear!

**Exec into container to verify**:
```bash
docker exec -it hello-app sh

# Inside container:
ls -la /app/src/component1/
# component1.js      ✓ Present
# component1.test.js ✗ NOT present (filtered by .dockerignore)

ls -la /app/src/component2/
# component2.js           ✓ Present
# component2 copy.js      ✓ Present
# component2.test.js      ✗ NOT present
# component2.test copy.js ✗ NOT present
```

---

## .dockerignore Deep Dive

### How Exclusion Works - Build Time vs Runtime

**Build Stage** (when `docker build` runs):

The `.dockerignore` file tells Docker which files to **exclude** during the build process. When the `COPY . .` command executes in the Dockerfile, Docker:

1. **Reads** the `.dockerignore` file
2. **Scans** all files in the build context directory
3. **Matches** files against the pattern `**/*.test.js`
4. **Filters out** matching files before copying
5. **Copies** only the remaining files to `/app` in the container

**Result**: Test files matching `**/*.test.js` are **ignored during the build** and will **NOT be viewable** when you exec into the container because they were **never copied** into the image.

### Why Files Are Not Viewable in Container

When you exec into a running container:

```bash
docker exec -it hello-app sh
ls -la /app/src/component1/
```

You will NOT see `component1.test.js` because:

1. ❌ The file was **excluded at build time** by `.dockerignore`
2. ❌ It was **never copied** from host → container during `COPY . .`
3. ❌ It does **not exist** in the Docker image layers
4. ❌ It is **permanently absent** from any container created from this image

The test files are not hidden - they simply **don't exist** in the container filesystem.

### Common .dockerignore Patterns

```
# Test files
**/*.test.js
**/*.spec.js
__tests__/

# Development dependencies
node_modules/      # If you want to rebuild deps in container
npm-debug.log

# Git files
.git/
.gitignore

# Documentation
*.md
docs/

# IDE files
.vscode/
.idea/
*.swp

# Environment files
.env
.env.local
*.pem

# Build artifacts
dist/
build/
coverage/
```

---

## Important Notes

### 1. Build Time vs Runtime

- `.dockerignore` applies **at build time** (during `docker build`)
- Changes to `.dockerignore` require rebuilding the image
- Running containers don't reflect `.dockerignore` changes until rebuilt

### 2. Modifying Files

**If you change index.js on your host**:
```bash
# Edit the file
vim index.js

# Rebuild the image (picks up changes)
docker build -t hello-from-node .

# Stop old container
docker stop hello-app && docker rm hello-app

# Start new container from updated image
docker run -d --name hello-app hello-from-node sleep infinity
```

### 3. Image Size Optimization

**Check image size**:
```bash
docker images hello-from-node
```

**Without .dockerignore**: Would include all test files
**With .dockerignore**: Excludes test files, smaller image

---

## Troubleshooting

### Test files appearing in container?
**Check** if `.dockerignore` pattern is correct:
```bash
cat .dockerignore
# Should contain: **/*.test.js
```

**Rebuild** image after fixing:
```bash
docker build --no-cache -t hello-from-node .
```

### Files missing that should be included?
**Verify** `.dockerignore` isn't too broad:
```bash
# Check what would be copied
docker build -t hello-from-node . --progress=plain 2>&1 | grep "transferring context"
```

### Container exits immediately?
**Check** if `index.js` exists and runs:
```bash
# Test locally first
node index.js

# Check container logs
docker logs hello-app
```

For long-running containers, use:
```bash
docker run -d --name hello-app hello-from-node sleep infinity
```

---

## Summary

This project demonstrates:

1. **`.dockerignore`** - Excluding test files from production images at build time
2. **`COPY . .`** - How Docker applies exclusion filters during the build stage
3. **Build optimization** - Smaller images, faster builds, cleaner production containers
4. **File relationships** - How Dockerfile, .dockerignore, and source files interact

**Key Takeaway**: Files matching `.dockerignore` patterns are **excluded at build time** and will **never exist** in the container, so they won't be viewable when you exec into the container. The exclusion happens during the build stage, not at runtime.
