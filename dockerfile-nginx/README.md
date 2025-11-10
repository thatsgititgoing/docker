# NGINX Docker Setup

This project demonstrates a custom NGINX web server running in Docker with a custom HTML page.

## Directory Structure

```
dockerfile-nginx/
├── Dockerfile      # Instructions to build the NGINX container image
├── index.html      # Custom HTML page served by NGINX
└── README.md       # This documentation
```

## File Details

### 1. Dockerfile

**Purpose**: Defines how to build the custom NGINX container image.

**Base Image**: `nginx:1.27.0`
- Official NGINX image version 1.27.0 from Docker Hub
- Provides a pre-configured NGINX web server

**Instructions Breakdown**:

```dockerfile
FROM nginx:1.27.0
```
- Starts with official NGINX v1.27.0 image as the foundation

```dockerfile
RUN apt-get update
RUN apt-get install -y vim
```
- Updates package list
- Installs vim text editor for debugging/editing inside the container

```dockerfile
COPY ./index.html /usr/share/nginx/html/index.html
```
- **Links to**: [index.html](index.html)
- **Source**: `./index.html` on your host machine (this directory)
- **Destination**: `/usr/share/nginx/html/index.html` inside the container
- **Purpose**: Replaces NGINX's default welcome page with your custom HTML

**Key Location**: `/usr/share/nginx/html/` is NGINX's default document root where it serves static files

```dockerfile
RUN chown nginx:nginx /usr/share/nginx/html/index.html
```
- Sets file ownership to `nginx` user and `nginx` group
- Ensures NGINX has proper permissions to read and serve the file

---

### 2. index.html

**Purpose**: Custom HTML page that NGINX will serve to visitors.

**Content**:
- Simple HTML5 page with custom styling
- Welcome message: "Welcome to my custom, Dockerfile-based NGINX"
- Explains that the file was copied from the local machine

**Connection to Dockerfile**:
- This file is **copied** into the container at build time (line 9 of Dockerfile)
- Becomes the landing page when you access the NGINX server
- Replaces the default NGINX welcome page

---

## How Files Link Together

### Build Process Flow

```
1. Dockerfile (line 2)
   └─> Pulls nginx:1.27.0 base image

2. Dockerfile (lines 5-6)
   └─> Installs vim inside the container

3. Dockerfile (line 9) + index.html
   └─> Copies index.html from HOST → CONTAINER
       HOST: /home/alex/docker/dockerfile-nginx/index.html
       CONTAINER: /usr/share/nginx/html/index.html

4. Dockerfile (line 12)
   └─> Sets proper file permissions on copied index.html
```

### Runtime Flow

```
1. NGINX starts automatically (default CMD from base image)
2. NGINX reads configuration (default: /etc/nginx/nginx.conf)
3. NGINX serves files from /usr/share/nginx/html/
4. Browser requests http://localhost → NGINX serves index.html
```

---

## Usage

### Build the Image

```bash
cd /home/alex/docker/dockerfile-nginx
docker build -t custom-nginx .
```

### Run the Container

```bash
docker run -d -p 8080:80 --name my-nginx custom-nginx
```

**Port Mapping**:
- `-p 8080:80` maps host port 8080 → container port 80
- Access via: http://localhost:8080

### Test the Server

```bash
# Using curl
curl http://localhost:8080

# Or open in browser
xdg-open http://localhost:8080
```

You should see the custom message from [index.html](index.html).

### Exec into Container (Debug)

```bash
docker exec -it my-nginx bash
```

Inside the container:
```bash
# View the HTML file
cat /usr/share/nginx/html/index.html

# Edit with vim (installed in Dockerfile)
vim /usr/share/nginx/html/index.html

# Check file permissions
ls -la /usr/share/nginx/html/index.html
```

---

## File Dependencies Diagram

```
┌─────────────┐
│ Dockerfile  │
└──────┬──────┘
       │
       ├─── Uses base: nginx:1.27.0
       │
       ├─── Installs: vim
       │
       ├─── COPY ─────┐
       │              │
       │         ┌────▼─────────┐
       │         │  index.html  │
       │         └────┬─────────┘
       │              │
       └─── Sets permissions on copied file
                      │
                      ▼
              Container Runtime
              NGINX serves at:
              /usr/share/nginx/html/index.html
```

---

## Important Notes

1. **Changes to index.html require rebuild**:
   - If you edit `index.html` on your host, you must rebuild the image
   - Running containers won't see changes until recreated from new image

2. **NGINX default port**: 80 inside container
   - Map to any available port on host (e.g., `-p 8080:80`)

3. **File permissions**:
   - The `chown` command ensures NGINX can read the file
   - Without proper permissions, you'll get 403 Forbidden errors

4. **Vim installation**:
   - Allows editing files inside the container for debugging
   - Not required for production (adds ~60MB to image size)

---

## Troubleshooting

### Cannot access http://localhost:8080
- Check container is running: `docker ps`
- Verify port mapping: `docker port my-nginx`
- Check NGINX logs: `docker logs my-nginx`

### Getting NGINX default page instead of custom page
- Rebuild image: `docker build -t custom-nginx .`
- Stop old container: `docker stop my-nginx && docker rm my-nginx`
- Start new container from rebuilt image

### 403 Forbidden error
- Check file permissions inside container:
  ```bash
  docker exec my-nginx ls -la /usr/share/nginx/html/index.html
  ```
- Should show `nginx nginx` as owner