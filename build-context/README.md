# Hello from Node - Docker Build

## .dockerignore Explanation

### Current Configuration

The [.dockerignore](.dockerignore) file contains:
```
**/*.test.js
```

### What This Does

When you build the Docker image with `docker build -t hello-from-node .`, the `.dockerignore` file tells Docker to **ignore** and **exclude** specific files during the build process.

### Files Ignored

With the pattern `**/*.test.js`, these files are excluded from the build:
- `src/component1/component1.test.js` L (ignored)
- `src/component2/component2.test.js` L (ignored)

### Files Included

All other files are copied into the container:
- `Dockerfile` 
- `.dockerignore` 
- `index.js` 
- `src/component1/component1.js` 
- `src/component2/component2.js` 

### How It Works - Build Stage

1. **Build command**: `docker build -t hello-from-node .`
2. **Docker reads** `.dockerignore` file
3. **Dockerfile executes** `COPY . .` command
4. **Docker filters** files matching `**/*.test.js` pattern
5. **Only non-ignored files** are copied to `/app` in the container

### Result - Inside Container

When you exec into the container:
```bash
docker exec -it <container-name> sh
ls -la /app/src/component1/
```

You will see:
```
component1.js       Present
```

You will NOT see:
```
component1.test.js L Not in container (ignored during build)
```

### Key Point

**The test files are excluded at build time.** They never make it into the Docker image, so they will never be visible when you exec into any container created from this image.

## Build & Test

```bash
# Build the image
docker build -t hello-from-node .

# Run a container
docker run -d --name hello-app hello-from-node sleep infinity

# Exec into the container
docker exec -it hello-app sh

# Inside container - check files
ls -la /app/src/component1/
# You'll see component1.js but NOT component1.test.js
```