# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

## 🐳 Docker Configuration

This project supports both **development** and **production** Docker configurations.

### Docker Files

**Dockerfile (Production)** - Multi-stage build for deployment
- **Stage 1 (builder):** Compiles React application using Node.js Alpine
- **Stage 2 (runner):** Serves static files using Nginx Unprivileged
- **Security Rating:** 8.5/10
- **Final Image Size:** ~40-50 MB
- **Port:** 8080

**.dockerignore** - Excludes unnecessary files from Docker build context
- Prevents `node_modules` and `build` artifacts from being copied
- Reduces build context size and improves build performance

For detailed Docker documentation, see [DOCKER-README.md](./DOCKER-README.md).

---

## 🔥 Hot Reloading for Development

### What is Hot Reloading?

**Hot Reloading** (also called Hot Module Replacement or HMR) is a development feature that automatically updates your application in the browser when you make code changes, **without requiring a full page refresh or container restart**.

### How Hot Reloading Works

1. **File Watcher:** Development server monitors your source files for changes
2. **Change Detection:** When you save a file, the watcher detects the modification
3. **Module Replacement:** Only the changed module is updated in the running app
4. **State Preservation:** Component state is preserved during updates (when possible)
5. **Instant Feedback:** Changes appear in browser within milliseconds

### Benefits for Development

**⚡ Faster Development Cycle**
- See changes instantly (< 1 second)
- No manual browser refresh needed
- No container rebuilds required
- No waiting for full rebuild

**🎯 State Preservation**
- Application state remains intact
- Form inputs keep their values
- Navigation position preserved
- No need to recreate test scenarios

**🐛 Better Debugging Experience**
- Errors appear immediately
- Source maps work correctly
- Console logs persist across updates
- Easier to track down issues

**💡 Improved Productivity**
- Rapid iteration and experimentation
- Immediate visual feedback
- Reduced context switching
- Flow state maintenance

---

## 🚀 Development vs Production Environments

### Development with Hot Reloading

**Run development environment with Docker:**

```bash
docker run --rm -d -p 3000:3000 -v ./public:/app/public -v ./src:/app/src react-app:dev
```

**What this command does:**

- `--rm` - Automatically remove container when stopped
- `-d` - Run in detached mode (background)
- `-p 3000:3000` - Map host port 3000 to container port 3000
- `-v ./public:/app/public` - Mount public folder (hot reload for static assets)
- `-v ./src:/app/src` - Mount src folder (hot reload for React components)
- `react-app:dev` - Development Docker image

**How volume mounting enables hot reload:**

```
Your Computer                    Docker Container
├── src/                    ←→   /app/src/
│   └── App.js (you edit)        └── App.js (auto-synced)
│                                     ↓
│                                Webpack Dev Server detects change
│                                     ↓
└── Browser ←─────────────── Hot Module Replacement (HMR)
    (auto-updates)
```

**Development workflow:**

1. Start development container with volume mounts
2. Edit code in your IDE on host machine
3. Save file (`Ctrl+S`)
4. Changes sync to container via volume mount
5. Webpack dev server detects file change
6. Hot reload triggers in browser
7. See changes instantly (< 1 second)

**Access the development application:**
```
http://localhost:3000
```

**Stop the development container:**
```bash
docker stop <container-id>
# or find container ID first
docker ps
docker stop <container-id>
```

### Production Deployment

**Build production Docker image:**

```bash
docker build -t my-react-app:latest .
```

**Run production container:**

```bash
docker run -d -p 3000:8080 --name react-app my-react-app:latest
```

**Access the production application:**
```
http://localhost:3000
```

**Key difference:** Production uses Nginx to serve pre-built static files. No hot reloading, no volume mounts.

---

## 📊 Development vs Production Comparison

| Feature | Development (react-app:dev) | Production (react-app:latest) |
|---------|----------------------------|-------------------------------|
| **Hot Reloading** | ✅ Yes (via volumes) | ❌ No |
| **Volume Mounts** | ✅ ./src, ./public | ❌ None |
| **Server** | Webpack Dev Server | Nginx |
| **Port** | 3000 | 8080 |
| **Image Size** | ~900 MB | ~40 MB |
| **Startup Time** | 5-10 seconds | <1 second |
| **Performance** | Slower (unoptimized) | Fast (optimized) |
| **Source Maps** | ✅ Included | ❌ Excluded |
| **Error Messages** | Detailed, helpful | Generic |
| **Build Required** | No (on file change) | Yes (rebuild image) |
| **Use Case** | Active development | Deployment |
| **Rebuild on Change** | ❌ No | ✅ Yes |

---

## 🎯 When to Use Each Environment

### Use Development Docker (with hot reload)

**Perfect for:**
- ✅ Writing new features
- ✅ Debugging issues
- ✅ Testing UI changes
- ✅ Rapid iteration
- ✅ Consistent dev environment across team
- ✅ Avoiding "works on my machine" issues

**Command:**
```bash
docker run --rm -d -p 3000:3000 -v ./public:/app/public -v ./src:/app/src react-app:dev
```

**Advantages:**
- Same environment for all developers
- No need to install Node.js on host
- Changes reflect instantly
- Isolated dependencies

### Use Production Docker (static nginx)

**Perfect for:**
- ✅ Final testing before deployment
- ✅ Performance testing
- ✅ Deployment to servers
- ✅ CI/CD pipelines
- ✅ Production environment
- ✅ Staging environment

**Command:**
```bash
docker build -t my-react-app:latest .
docker run -d -p 3000:8080 my-react-app:latest
```

**Advantages:**
- Optimized performance
- Small image size
- Production-ready
- Secure (non-root, minimal attack surface)

### Use Local npm (no Docker)

**Perfect for:**
- ✅ Quick prototyping
- ✅ Fastest hot reload (no Docker overhead)
- ✅ Direct access to node_modules
- ✅ Easier debugging with IDE integration

**Command:**
```bash
npm start
```

**Advantages:**
- Absolute fastest hot reload
- No Docker overhead
- Simplest setup
- Direct filesystem access

---

## 🔧 Development Docker Hot Reload Setup

### How Volume Mounts Work

**Volume mounting syntax:**
```bash
-v <host-path>:<container-path>
```

**In this project:**
```bash
-v ./public:/app/public    # Static assets (favicon, index.html)
-v ./src:/app/src          # React source code
```

**What gets mounted:**
- ✅ `./public` - Static files, manifest, icons
- ✅ `./src` - All React components, styles, assets
- ❌ `node_modules` - NOT mounted (uses container's modules)
- ❌ `build` - NOT mounted (not needed in dev)

**Why not mount everything?**

```bash
# ❌ DON'T DO THIS
-v .:/app  # Overwrites node_modules, breaks the container
```

**Problem:** Mounting entire directory overwrites container's `node_modules`, which may be compiled for a different OS/architecture.

**Solution:** Mount only source directories you edit.

### Troubleshooting Hot Reload

**Hot reload not working in Docker:**

1. **Check if volumes are mounted correctly:**
   ```bash
   docker inspect <container-id> | grep Mounts -A 10
   ```

2. **Verify file watcher is enabled:**
   ```bash
   # Inside container, check if polling is enabled
   docker exec -it <container-id> env | grep CHOKIDAR
   ```

3. **Enable polling for file watcher (if needed):**
   ```bash
   # Run with environment variables
   docker run --rm -d -p 3000:3000 \
     -v ./public:/app/public \
     -v ./src:/app/src \
     -e CHOKIDAR_USEPOLLING=true \
     -e WATCHPACK_POLLING=true \
     react-app:dev
   ```

4. **Check logs for errors:**
   ```bash
   docker logs <container-id>
   ```

5. **Restart container:**
   ```bash
   docker stop <container-id>
   docker run --rm -d -p 3000:3000 -v ./public:/app/public -v ./src:/app/src react-app:dev
   ```

**Changes not appearing:**

1. **Verify file is saved** - Check editor status
2. **Check browser console** - Look for errors (F12)
3. **Hard refresh browser** - `Ctrl+Shift+R`
4. **Check file is in mounted directory** - Only `src/` and `public/` are mounted
5. **Verify container is running** - `docker ps`

**Slow hot reload in Docker:**

- Docker volume mounts can be slower on Windows/Mac
- Native filesystem access (`npm start`) is faster
- Consider using `npm start` locally if Docker HMR is slow

---

## 💻 Development Workflow Comparison

### Option 1: Docker with Hot Reload (Recommended for Teams)

```bash
# Start development container
docker run --rm -d -p 3000:3000 -v ./public:/app/public -v ./src:/app/src react-app:dev

# Edit code in your IDE
# Save file → Changes appear in browser instantly

# When done
docker ps
docker stop <container-id>
```

**Pros:**
- ✅ Consistent environment across team
- ✅ No Node.js installation needed
- ✅ Isolated dependencies
- ✅ Same as production environment (almost)

**Cons:**
- ⚠️ Slightly slower than native `npm start`
- ⚠️ Requires Docker knowledge
- ⚠️ Volume mounting overhead on Windows/Mac

### Option 2: Local npm (Fastest for Solo Development)

```bash
# Start development server
npm start

# Edit code in your IDE
# Save file → Changes appear in browser instantly

# When done
Ctrl+C to stop
```

**Pros:**
- ✅ Fastest hot reload
- ✅ Simple setup
- ✅ Best IDE integration
- ✅ Direct filesystem access

**Cons:**
- ⚠️ Requires Node.js installation
- ⚠️ "Works on my machine" issues
- ⚠️ Dependencies must match team

### Option 3: Production Docker (Testing Only)

```bash
# Build image
docker build -t my-react-app:latest .

# Run container
docker run -d -p 3000:8080 my-react-app:latest

# Test → Rebuild for each change
docker build -t my-react-app:latest .
```

**Pros:**
- ✅ Production-identical environment
- ✅ Performance testing
- ✅ Security testing

**Cons:**
- ❌ No hot reload
- ❌ Must rebuild image for each change (slow)
- ❌ Not suitable for active development

---

## 🎓 Best Practices

### For Development

1. ✅ **Use Docker with volumes for consistent team environment**
   ```bash
   docker run --rm -d -p 3000:3000 -v ./public:/app/public -v ./src:/app/src react-app:dev
   ```

2. ✅ **Use local npm for solo work when speed is critical**
   ```bash
   npm start
   ```

3. ✅ **Keep browser DevTools open** - Monitor errors and network
4. ✅ **Use React DevTools extension** - Inspect component hierarchy
5. ✅ **Save files frequently** - Trigger hot reload to catch errors early

### For Production

1. ✅ **Always test production build before deploying**
   ```bash
   npm run build
   docker build -t my-react-app:latest .
   docker run -p 3000:8080 my-react-app:latest
   ```

2. ✅ **Monitor bundle size**
   ```bash
   npm run build
   # Check output for bundle size warnings
   ```

3. ✅ **Test in production Docker image locally**
4. ✅ **Use specific version tags** - Not `:latest` in production
5. ✅ **Scan for vulnerabilities**
   ```bash
   docker scout cves my-react-app:latest
   ```

---

## 📈 Performance Tips

### Optimize Hot Reload Speed

**Docker (with volumes):**
- Expected hot reload: 500ms - 2 seconds
- If slower, try enabling polling:
  ```bash
  docker run --rm -d -p 3000:3000 \
    -v ./public:/app/public \
    -v ./src:/app/src \
    -e CHOKIDAR_USEPOLLING=true \
    react-app:dev
  ```

**Local npm:**
- Expected hot reload: 50ms - 500ms
- Fastest option for development

**General Tips:**
1. ✅ Keep components small - Smaller files = faster reload
2. ✅ Minimize dependencies - Fewer imports = faster reload
3. ✅ Use code splitting - Lazy load heavy components
4. ✅ Close unused apps - Free up system resources
5. ✅ Use SSD - Faster file watching

---

## 📚 Additional Resources

- [Create React App Documentation](https://create-react-app.dev/)
- [React Fast Refresh](https://github.com/facebook/react/tree/main/packages/react-refresh)
- [Docker Volumes](https://docs.docker.com/storage/volumes/)
- [Docker Development Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Production Deployment Guide](./DOCKER-README.md)
