# Container Express App - Dockerized Node.js API

This is a Node.js Express application containerized with Docker, implementing a simple user registration REST API.

## Directory Structure

```
container-express-app/
├── Dockerfile         # Container build instructions
├── package.json       # Node.js dependencies and scripts
├── package-lock.json  # Locked dependency versions
├── node_modules/      # Installed npm packages (not copied to container)
├── README.md          # This documentation
└── src/
    └── index.js       # Express application code
```

---

## File Details

### 1. Dockerfile

**Purpose**: Defines how to build the containerized Express application with optimized layer caching.

**Content**:
```dockerfile
FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/index.js ./
EXPOSE 3000
CMD ["node", "index.js"]
```

**Instructions Breakdown**:

```dockerfile
FROM node:22
```
- **Base Image**: Official Node.js v22 (full version, not Alpine)
- **Size**: ~400MB (includes build tools for native modules)
- **Links to**: Docker Hub `node:22` image

```dockerfile
WORKDIR /app
```
- **Sets working directory** to `/app` inside container
- All subsequent commands execute from this directory
- Files are copied to this location

```dockerfile
COPY package*.json ./
```
- **Source**: `package.json` and `package-lock.json` from build context
- **Destination**: `/app/` in container
- **Purpose**: Copy dependency files BEFORE source code
- **Why separate**: Enables Docker layer caching - dependencies don't rebuild when code changes
- **Links to**: [package.json](package.json), package-lock.json

```dockerfile
RUN npm ci
```
- **Command**: `npm ci` (clean install)
- **Purpose**: Installs dependencies from `package-lock.json` (reproducible builds)
- **Difference from `npm install`**:
  - Faster
  - Requires `package-lock.json`
  - Deletes `node_modules` before installing
  - Better for CI/CD and containers
- **Creates**: `/app/node_modules/` directory with Express and body-parser

```dockerfile
COPY src/index.js ./
```
- **Source**: `src/index.js` from build context
- **Destination**: `/app/index.js` in container (flattens directory structure)
- **Why after npm ci**: Prevents cache invalidation when code changes
- **Links to**: [src/index.js](src/index.js)

```dockerfile
EXPOSE 3000
```
- **Purpose**: Documents that container listens on port 3000
- **Note**: Does NOT actually publish the port (use `-p 3000:3000` when running)
- **Links to**: PORT constant in [src/index.js](src/index.js:5)

```dockerfile
CMD ["node", "index.js"]
```
- **Command**: Starts the Express server
- **Runs**: `/app/index.js` (copied from `src/index.js`)
- **Note**: JSON array format (exec form) - preferred over shell form

---

### 2. package.json

**Purpose**: Defines Node.js project metadata, dependencies, and npm scripts.

**Content**:
```json
{
  "name": "container-express-app",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "body-parser": "1.20.2",
    "express": "4.19.2"
  }
}
```

**Key Fields**:

- **`name`**: Package identifier
- **`main`**: Entry point for the application
- **`scripts.start`**: `npm start` command (for local development)
- **`dependencies`**:
  - **`express: 4.19.2`** - Web framework for Node.js
  - **`body-parser: 1.20.2`** - Middleware to parse JSON request bodies

**Connection to Dockerfile**:
- **Copied** to container at line 6: `COPY package*.json ./`
- **Used** by `npm ci` at line 8 to install dependencies
- **Note**: `scripts.start` is for local dev - container uses `CMD ["node", "index.js"]` instead

---

### 3. src/index.js

**Purpose**: Express application implementing a user registration REST API.

**Functionality**:

**Dependencies**:
```javascript
const express = require('express');
const bodyParser = require('body-parser');
```

**Application Setup**:
```javascript
const app = express();
const PORT = 3000;
const users = [];  // In-memory user storage
app.use(bodyParser.json());
```

**API Endpoints**:

1. **GET /** - Health check endpoint
   ```javascript
   app.get('/', (req, res) => {
       res.send('Hello, World!');
   });
   ```
   - **Returns**: Plain text "Hello, World!"
   - **Use**: Verify server is running

2. **GET /users** - Retrieve all registered users
   ```javascript
   app.get('/users', (req, res) => {
       return res.json({ users });
   });
   ```
   - **Returns**: JSON array of registered user IDs
   - **Example response**: `{"users": ["user123", "user456"]}`

3. **POST /users** - Register a new user
   ```javascript
   app.post('/users', (req, res) => {
       const newUserId = req.body.userId;
       // Validation and registration logic
   });
   ```
   - **Request body**: `{"userId": "user123"}`
   - **Validation**:
     - Returns 400 if `userId` is missing
     - Returns 400 if user already exists
   - **Success**: Returns 201 with "User registered successfully."

**Server Start**:
```javascript
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
```
- **Listens on**: Port 3000
- **Links to**: `EXPOSE 3000` in [Dockerfile](Dockerfile:12)

**Connection to Dockerfile**:
- **Copied** from `src/index.js` (host) → `/app/index.js` (container) at line 10
- **Executed** by `CMD ["node", "index.js"]` at line 14
- **Dependencies** (express, body-parser) installed by `npm ci` at line 8

---

### 4. node_modules/

**Purpose**: Contains all installed npm dependencies (express, body-parser, and their transitive dependencies).

**In Development** (on host):
- Created by running `npm install`
- Contains ~60+ packages

**In Container**:
- Created by `RUN npm ci` in Dockerfile (line 8)
- Installed fresh inside the container
- Host's `node_modules/` is NOT copied to container (should be in `.dockerignore`)

**Why not copy from host**:
- Different OS (host vs container) may need different binaries
- Container builds from scratch for reproducibility
- Keeps build context small

---

## How Files Link Together

### Build Process Flow

```
1. Build Command
   └─> docker build -t express-app .

2. Dockerfile (line 1)
   └─> FROM node:22
       └─> Pulls Node.js v22 base image

3. Dockerfile (line 3)
   └─> WORKDIR /app
       └─> Sets working directory

4. Dockerfile (line 6) + package.json
   └─> COPY package*.json ./
       ├─> Copies package.json to /app/package.json
       └─> Copies package-lock.json to /app/package-lock.json

5. Dockerfile (line 8) + package.json dependencies
   └─> RUN npm ci
       ├─> Reads /app/package.json
       ├─> Installs express@4.19.2
       ├─> Installs body-parser@1.20.2
       └─> Creates /app/node_modules/

6. Dockerfile (line 10) + src/index.js
   └─> COPY src/index.js ./
       └─> Copies to /app/index.js

7. Dockerfile (line 12)
   └─> EXPOSE 3000
       └─> Documents port (matches src/index.js PORT)

8. Dockerfile (line 14)
   └─> CMD ["node", "index.js"]
       └─> Sets startup command
```

### Runtime Flow

```
1. Container starts
   └─> Executes: node index.js

2. Node.js loads /app/index.js
   └─> require('express') → loads from /app/node_modules/express/
   └─> require('body-parser') → loads from /app/node_modules/body-parser/

3. Express app initializes
   ├─> Sets up middleware (bodyParser.json())
   ├─> Registers routes (/, /users GET, /users POST)
   └─> Starts listening on port 3000

4. Server ready
   └─> Logs: "Server is running on http://localhost:3000"

5. Handles HTTP requests
   ├─> GET / → "Hello, World!"
   ├─> GET /users → {"users": [...]}
   └─> POST /users → Register new user
```

---

## File Dependencies Diagram

```
┌──────────────────┐     ┌────────────────────┐
│  package.json    │     │ package-lock.json  │
│                  │     │                    │
│ dependencies:    │     │ (locked versions)  │
│ - express 4.19.2 │     │                    │
│ - body-parser    │     │                    │
└────────┬─────────┘     └──────────┬─────────┘
         │                          │
         └──────────┬───────────────┘
                    │
         ┌──────────▼─────────────────────┐
         │     Dockerfile (line 6)        │
         │  COPY package*.json ./         │
         └──────────┬─────────────────────┘
                    │
         ┌──────────▼─────────────────────┐
         │     Dockerfile (line 8)        │
         │       RUN npm ci               │
         │  Installs dependencies         │
         └──────────┬─────────────────────┘
                    │
                    ├─> Creates /app/node_modules/
                    │   ├── express/
                    │   ├── body-parser/
                    │   └── ...60+ packages
                    │
┌───────────────────┴───────────────┐
│                                   │
│   src/index.js                    │
│   ├─ require('express')           │
│   └─ require('body-parser')       │
│                                   │
└───────────────────┬───────────────┘
                    │
         ┌──────────▼─────────────────────┐
         │     Dockerfile (line 10)       │
         │   COPY src/index.js ./         │
         └──────────┬─────────────────────┘
                    │
                    ├─> Copies to /app/index.js
                    │
         ┌──────────▼─────────────────────┐
         │     Dockerfile (line 14)       │
         │   CMD ["node", "index.js"]     │
         └──────────┬─────────────────────┘
                    │
                    ▼
              Container Runtime
              Runs Express server on port 3000
```

---

## Usage

### Build the Image

```bash
cd /home/alex/docker/container-express-app
docker build -t express-app:v1 .
```

**Build steps**:
1. Pull `node:22` base image
2. Create `/app` directory
3. Copy `package.json` and `package-lock.json`
4. Install dependencies with `npm ci`
5. Copy `src/index.js` to `/app/index.js`
6. Tag image as `express-app:v1`

### Run the Container

```bash
docker run -d -p 3000:3000 --name express-api express-app:v1
```

**Flags explained**:
- `-d` - Run in detached mode (background)
- `-p 3000:3000` - Map host port 3000 → container port 3000
- `--name express-api` - Name the container
- `express-app:v1` - Image to use

**Verify it's running**:
```bash
docker ps
# Should show express-api container running
```

### Test the API

**1. Health check**:
```bash
curl http://localhost:3000
# Output: Hello, World!
```

**2. Get users** (initially empty):
```bash
curl http://localhost:3000/users
# Output: {"users":[]}
```

**3. Register a user**:
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
# Output: User registered successfully.
```

**4. Get users** (now has user123):
```bash
curl http://localhost:3000/users
# Output: {"users":["user123"]}
```

**5. Try duplicate registration**:
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
# Output: User already exists (400 error)
```

### View Logs

```bash
docker logs express-api
# Output: Server is running on http://localhost:3000
```

**Follow logs in real-time**:
```bash
docker logs -f express-api
```

### Exec into Container

```bash
docker exec -it express-api bash
```

**Inside the container**:
```bash
# Check files
ls -la /app
# Dockerfile is NOT here (wasn't copied)
# index.js IS here (copied from src/index.js)
# node_modules/ IS here (created by npm ci)

# Verify Node.js version
node --version
# v22.x.x

# Check installed packages
npm list --depth=0
# express@4.19.2
# body-parser@1.20.2

# Exit container
exit
```

### Stop and Remove Container

```bash
docker stop express-api
docker rm express-api
```

---

## Docker Layer Caching Optimization

### Why Copy package.json Before src/index.js?

The Dockerfile order is optimized for **Docker layer caching**:

```dockerfile
COPY package*.json ./   # Layer 1: Changes rarely
RUN npm ci              # Layer 2: Expensive, reuses cache if package.json unchanged
COPY src/index.js ./    # Layer 3: Changes frequently
```

**Benefits**:

1. **Code changes don't trigger npm ci**:
   - Edit `src/index.js` → Only Layer 3 rebuilds
   - `npm ci` layer is cached → **Much faster builds**

2. **Dependency changes trigger reinstall**:
   - Edit `package.json` → Layers 2 & 3 rebuild
   - Ensures dependencies are always up-to-date

**Bad Example** (don't do this):
```dockerfile
COPY . .           # Copies everything
RUN npm ci         # Runs on EVERY code change
```
- Every code edit invalidates cache
- `npm ci` runs every time (~30 seconds wasted)

---

## Important Notes

### 1. Port Mapping

**Inside container**: App listens on port 3000
**Host access**: Must map with `-p` flag

```bash
# Map host:8080 → container:3000
docker run -d -p 8080:3000 express-app:v1
curl http://localhost:8080  # Access via port 8080
```

### 2. Data Persistence

**Current setup**: In-memory storage (`const users = []`)
- Data is lost when container stops
- Each container has its own separate data

**For production**: Use a database (PostgreSQL, MongoDB, etc.) or volumes

### 3. Environment Variables

**To configure PORT dynamically**:

Edit [src/index.js](src/index.js:5):
```javascript
const PORT = process.env.PORT || 3000;
```

Edit [Dockerfile](Dockerfile:12):
```dockerfile
EXPOSE ${PORT}
```

Run with custom port:
```bash
docker run -d -p 8080:8080 -e PORT=8080 express-app:v1
```

### 4. Development vs Production

**Current Dockerfile**: Uses full `node:22` image (~400MB)

**For production**, use Alpine:
```dockerfile
FROM node:22-alpine  # ~170MB smaller
```

**For development**, use volumes to avoid rebuilds:
```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/src:/app/src \
  express-app:v1
```

---

## Troubleshooting

### Port 3000 already in use
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Or use a different port
docker run -d -p 8080:3000 express-app:v1
```

### npm ci fails during build
```bash
# Ensure package-lock.json exists
ls -la package-lock.json

# Regenerate if missing
npm install
```

### Container exits immediately
```bash
# Check logs for errors
docker logs express-api

# Common issue: syntax error in index.js
# Test locally first:
node src/index.js
```

### Cannot access API from browser
```bash
# Verify container is running
docker ps

# Check port mapping
docker port express-api
# Should show: 3000/tcp -> 0.0.0.0:3000

# Test from inside container
docker exec express-api curl localhost:3000
```

### Changes to index.js not appearing
```bash
# Must rebuild image after code changes
docker build -t express-app:v1 .

# Stop old container
docker stop express-api && docker rm express-api

# Start new container from updated image
docker run -d -p 3000:3000 --name express-api express-app:v1
```

---

## Best Practices Implemented

1. ✅ **Layer caching**: Copy package.json before source code
2. ✅ **`npm ci` instead of `npm install`**: Faster, reproducible builds
3. ✅ **EXPOSE port**: Documents which port the app uses
4. ✅ **JSON array CMD**: `["node", "index.js"]` instead of `"node index.js"`
5. ✅ **WORKDIR**: Explicit working directory

## Potential Improvements

1. **Add .dockerignore**: Exclude `node_modules/`, `.git/`, etc.
2. **Use Alpine**: Smaller image size (`FROM node:22-alpine`)
3. **Multi-stage build**: Separate build and runtime environments
4. **Health check**: `HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1`
5. **Non-root user**: Run as non-privileged user for security
6. **Environment variables**: Make PORT configurable

---

## Summary

This project demonstrates:

1. **Dockerizing a Node.js Express app** - Complete containerization workflow
2. **npm dependency management** - Using `package.json` and `npm ci` in containers
3. **Layer caching optimization** - Separating dependency and code layers
4. **REST API in containers** - Running a web server with port mapping
5. **File relationships** - How Dockerfile, package.json, and source code interact

**Key Takeaway**: The Dockerfile copies `package.json` first and runs `npm ci` before copying source code. This optimizes build speed through Docker layer caching - code changes don't trigger dependency reinstalls.
