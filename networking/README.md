# Docker Networking Complete Guide

Comprehensive guide to Docker networking, including finding IP addresses, creating networks, container communication, and host networking.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Network Types](#network-types)
3. [Finding Container IP Addresses](#finding-container-ip-addresses)
4. [Creating and Managing Networks](#creating-and-managing-networks)
5. [Docker Network Inspect](#docker-network-inspect)
6. [Adding Containers to Networks](#adding-containers-to-networks)
7. [Host Networking](#host-networking)
8. [Container Communication](#container-communication)
9. [Practical Examples](#practical-examples)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Docker networking allows containers to communicate with each other and the outside world. Understanding Docker networking is essential for:

- Container-to-container communication
- Service discovery
- Load balancing
- Security isolation
- Multi-host deployments

### Default Behavior

When Docker is installed, it creates **three default networks**:

```bash
docker network ls
```

**Output:**
```
NETWORK ID     NAME      DRIVER    SCOPE
abc123def456   bridge    bridge    local
789ghi012jkl   host      host      local
345mno678pqr   none      null      local
```

---

## Network Types

Docker supports several network drivers, each for different use cases:

### 1. Bridge Network (Default)

**Most common network type.**

**Characteristics:**
- Default network for containers
- Provides isolation between containers
- Containers can communicate within same bridge network
- NAT to host network for external communication

**When to use:**
- ✅ Most applications
- ✅ Container-to-container communication on single host
- ✅ Default choice unless specific needs

**Example:**
```bash
# Creates container on default bridge
docker run -d --name web nginx

# Create custom bridge network
docker network create my-bridge
docker run -d --name app --network my-bridge nginx
```

---

### 2. Host Network

**Container shares host's network stack directly.**

**Characteristics:**
- No network isolation
- Container uses host's IP address
- Best performance (no NAT overhead)
- Port conflicts possible
- No port mapping needed

**When to use:**
- ✅ Performance-critical applications
- ✅ Need to bind to many ports
- ✅ Network monitoring tools
- ⚠️ Less isolation (security consideration)

**Example:**
```bash
# Container uses host network directly
docker run -d --name nginx --network host nginx

# Nginx now accessible on host's IP:80
# No -p flag needed
```

---

### 3. Overlay Network

**Multi-host networking for Docker Swarm.**

**Characteristics:**
- Spans multiple Docker hosts
- Enables Swarm services to communicate
- Requires key-value store

**When to use:**
- ✅ Docker Swarm clusters
- ✅ Multi-host container communication
- ✅ Microservices across hosts

---

### 4. Macvlan Network

**Assign MAC address to container.**

**Characteristics:**
- Container appears as physical device on network
- Direct connection to physical network
- Best performance for legacy apps

**When to use:**
- ✅ Legacy applications expecting physical network
- ✅ Direct L2 connectivity needed
- ✅ VM-like networking

---

### 5. None Network

**No networking.**

**Characteristics:**
- Complete network isolation
- Container has no network interface (except loopback)

**When to use:**
- ✅ Maximum isolation
- ✅ Containers that don't need network
- ✅ Security-sensitive workloads

**Example:**
```bash
docker run -d --name isolated --network none alpine sleep 3600
```

---

## Finding Container IP Addresses

### Method 1: Docker Inspect (Most Common)

**Get IP address of specific container:**

```bash
docker inspect <container> --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

**Example:**
```bash
# Create container
docker run -d --name web nginx

# Get IP address
docker inspect web --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
# Output: 172.17.0.2
```

---

### Method 2: Docker Inspect with Network Details

**Get detailed network info:**

```bash
docker inspect <container> --format='{{json .NetworkSettings.Networks}}' | jq
```

**Example:**
```bash
docker inspect web --format='{{json .NetworkSettings.Networks}}' | jq
```

**Output:**
```json
{
  "bridge": {
    "IPAMConfig": null,
    "Links": null,
    "Aliases": null,
    "NetworkID": "abc123...",
    "EndpointID": "def456...",
    "Gateway": "172.17.0.1",
    "IPAddress": "172.17.0.2",
    "IPPrefixLen": 16,
    "IPv6Gateway": "",
    "GlobalIPv6Address": "",
    "GlobalIPv6PrefixLen": 0,
    "MacAddress": "02:42:ac:11:00:02",
    "DriverOpts": null
  }
}
```

---

### Method 3: Exec into Container

**Check from inside container:**

```bash
# Method A: ip command
docker exec <container> ip addr show

# Method B: hostname command
docker exec <container> hostname -i

# Method C: ifconfig (if installed)
docker exec <container> ifconfig
```

**Example:**
```bash
docker exec web hostname -i
# Output: 172.17.0.2
```

---

### Method 4: Docker Network Inspect

**Find all containers in a network:**

```bash
docker network inspect <network> --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'
```

**Example:**
```bash
docker network inspect bridge --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'
```

**Output:**
```
web: 172.17.0.2/16
db: 172.17.0.3/16
```

---

### Method 5: Quick One-Liner

**Get IP for all running containers:**

```bash
docker ps -q | xargs docker inspect --format='{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

**Example output:**
```
/web - 172.17.0.2
/db - 172.17.0.3
/cache - 172.17.0.4
```

---

## Creating and Managing Networks

### Create Network

**Basic bridge network:**
```bash
docker network create my-network
```

**With specific subnet:**
```bash
docker network create \
  --driver bridge \
  --subnet=192.168.100.0/24 \
  --gateway=192.168.100.1 \
  my-network
```

**With custom options:**
```bash
docker network create \
  --driver bridge \
  --subnet=172.20.0.0/16 \
  --ip-range=172.20.240.0/20 \
  --gateway=172.20.0.1 \
  --opt "com.docker.network.bridge.name"="my-bridge" \
  custom-network
```

---

### List Networks

```bash
# List all networks
docker network ls

# Filter by driver
docker network ls --filter driver=bridge

# Filter by name
docker network ls --filter name=my-network
```

**Example output:**
```
NETWORK ID     NAME           DRIVER    SCOPE
abc123def456   bridge         bridge    local
789ghi012jkl   host           host      local
345mno678pqr   my-network     bridge    local
```

---

### Remove Network

```bash
# Remove specific network
docker network rm my-network

# Remove all unused networks
docker network prune

# Force remove (disconnect containers first)
docker network rm -f my-network
```

---

## Docker Network Inspect

**The `docker network inspect` command provides detailed information about a network.**

### Basic Inspect

```bash
docker network inspect <network-name>
```

**Example:**
```bash
docker network inspect bridge
```

**Output:**
```json
[
    {
        "Name": "bridge",
        "Id": "abc123def456...",
        "Created": "2025-11-15T10:00:00.000000000Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "abc123...": {
                "Name": "web",
                "EndpointID": "def456...",
                "MacAddress": "02:42:ac:11:00:02",
                "IPv4Address": "172.17.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]
```

---

### Inspect Specific Fields

**Get subnet:**
```bash
docker network inspect bridge --format='{{range .IPAM.Config}}{{.Subnet}}{{end}}'
# Output: 172.17.0.0/16
```

**Get gateway:**
```bash
docker network inspect bridge --format='{{range .IPAM.Config}}{{.Gateway}}{{end}}'
# Output: 172.17.0.1
```

**Get driver:**
```bash
docker network inspect bridge --format='{{.Driver}}'
# Output: bridge
```

**List containers in network:**
```bash
docker network inspect bridge --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'
```

**Get network options:**
```bash
docker network inspect bridge --format='{{json .Options}}' | jq
```

---

### Inspect Multiple Networks

```bash
docker network inspect bridge host
```

---

### Useful Inspect Queries

**Check if network is internal:**
```bash
docker network inspect my-network --format='{{.Internal}}'
# Output: false
```

**Check IPv6 enabled:**
```bash
docker network inspect my-network --format='{{.EnableIPv6}}'
# Output: false
```

**Get all container IPs in network:**
```bash
docker network inspect my-network \
  --format='{{range $k,$v := .Containers}}{{$v.Name}}: {{$v.IPv4Address}}{{"\n"}}{{end}}'
```

---

## Adding Containers to Networks

### Connect at Container Creation

**Single network:**
```bash
docker run -d --name web --network my-network nginx
```

**With specific IP:**
```bash
docker run -d --name web \
  --network my-network \
  --ip 192.168.100.10 \
  nginx
```

---

### Connect Existing Container

**Connect running container to network:**
```bash
docker network connect <network> <container>
```

**Example:**
```bash
# Create network
docker network create app-network

# Create container on default bridge
docker run -d --name web nginx

# Connect to new network
docker network connect app-network web

# Now container is on both networks!
docker inspect web --format='{{json .NetworkSettings.Networks}}' | jq
```

---

### Connect with Alias

**Give container a network alias:**
```bash
docker network connect --alias db my-network postgres-container
```

**Now other containers can reach it via "db" hostname.**

---

### Connect with IP

**Assign specific IP:**
```bash
docker network connect --ip 192.168.100.50 my-network web
```

---

### Disconnect Container

```bash
docker network disconnect <network> <container>
```

**Example:**
```bash
docker network disconnect my-network web
```

**Force disconnect:**
```bash
docker network disconnect -f my-network web
```

---

### Multiple Networks

**A container can be on multiple networks:**

```bash
# Create networks
docker network create frontend
docker network create backend

# Create container on frontend
docker run -d --name app --network frontend nginx

# Connect to backend too
docker network connect backend app

# Now app is on both networks
docker inspect app --format='{{json .NetworkSettings.Networks}}' | jq
```

---

## Host Networking

**Host networking gives container direct access to host's network stack.**

### How Host Networking Works

**Normal (bridge) networking:**
```
External → Host → Docker Bridge → Container
           |                      |
        Port 80              Port 80 (mapped)
```

**Host networking:**
```
External → Host/Container (shared network)
           |
        Port 80 (shared)
```

---

### Using Host Network

**Create container with host network:**
```bash
docker run -d --name nginx --network host nginx
```

**Key differences:**
- No `-p` flag needed (no port mapping)
- Container binds directly to host ports
- Container uses host's IP address
- No network isolation from host

---

### Host Network Example

```bash
# Start nginx on host network
docker run -d --name nginx --network host nginx

# Nginx now listening on host's port 80
# Access via host's IP
curl http://localhost:80
# or
curl http://<host-ip>:80

# Check what's listening
netstat -tlnp | grep :80
# Shows nginx process
```

---

### Finding IP in Host Network

**Container uses host's IP:**

```bash
# Get host IP
hostname -I

# Container has same IP
docker exec nginx hostname -I
# Same as host
```

---

### Host Network Use Cases

**When to use:**

1. **Performance-critical applications**
   - No NAT overhead
   - Direct network access
   - Lower latency

2. **Bind to many ports**
   ```bash
   # Don't want to map 100 ports manually
   docker run --network host monitoring-app
   ```

3. **Network tools**
   ```bash
   # Network scanner that needs raw network access
   docker run --network host --privileged network-tool
   ```

4. **Legacy applications**
   - Expect specific network interfaces
   - Need direct network access

---

### Host Network Limitations

**⚠️ Considerations:**

1. **No port isolation**
   ```bash
   # Can't run two nginx on host network
   docker run -d --network host nginx  # OK
   docker run -d --network host nginx  # FAILS - port 80 in use
   ```

2. **Security concerns**
   - Container can access all host network
   - Less isolation
   - Use carefully in production

3. **Not portable**
   - Different behavior on different hosts
   - Docker Desktop (Mac/Windows) has limitations

---

## Container Communication

### Same Network Communication

**Containers on same network can communicate by:**
1. Container name (automatic DNS)
2. Container ID
3. Network alias
4. IP address

**Example:**
```bash
# Create network
docker network create app-net

# Create database
docker run -d --name postgres \
  --network app-net \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# Create app (can connect to "postgres" hostname)
docker run -d --name api \
  --network app-net \
  -e DATABASE_URL=postgresql://postgres:5432/db \
  api-server

# Test connection
docker exec api ping postgres
# Works! DNS resolves "postgres" to container IP
```

---

### Different Network Communication

**Containers on different networks CANNOT communicate by default.**

**Solution 1: Connect to same network**
```bash
docker network connect shared-network container1
docker network connect shared-network container2
# Now they can communicate
```

**Solution 2: Link containers (legacy)**
```bash
docker run --link container1:alias container2
# Not recommended - use networks instead
```

---

### External Communication

**Containers can reach external networks by default:**

```bash
docker run alpine ping google.com
# Works
```

**Disable external access:**
```bash
docker network create --internal internal-net
docker run --network internal-net alpine ping google.com
# Fails - no external access
```

---

## Practical Examples

### Example 1: Web App with Database

```bash
# Create network
docker network create app-network

# Start database
docker run -d --name postgres \
  --network app-network \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# Start app (connects to "postgres" hostname)
docker run -d --name api \
  --network app-network \
  -p 8080:8080 \
  -e DATABASE_HOST=postgres \
  -e DATABASE_PORT=5432 \
  -e DATABASE_NAME=myapp \
  api-server

# Test connectivity
docker exec api ping postgres
# Output: PING postgres (172.20.0.2) 56(84) bytes of data.
```

---

### Example 2: Three-Tier Architecture

```bash
# Create networks
docker network create frontend
docker network create backend

# Database (backend only)
docker run -d --name postgres \
  --network backend \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# API (both networks)
docker run -d --name api \
  --network backend \
  -e DATABASE_HOST=postgres \
  api-server

docker network connect frontend api

# Web server (frontend only)
docker run -d --name nginx \
  --network frontend \
  -p 80:80 \
  nginx

# Result:
# - nginx can reach api
# - api can reach postgres
# - nginx CANNOT reach postgres (isolated)
```

---

### Example 3: Find All Container IPs

```bash
#!/bin/bash
# Script to list all container IPs

echo "Container IP Addresses:"
echo "======================="

docker ps --format "{{.Names}}" | while read container; do
  ip=$(docker inspect $container --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
  network=$(docker inspect $container --format='{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')
  echo "$container: $ip (network: $network)"
done
```

**Output:**
```
Container IP Addresses:
=======================
web: 172.17.0.2 (network: bridge)
db: 172.20.0.2 (network: app-network)
cache: 172.20.0.3 (network: app-network)
```

---

### Example 4: Custom Network with Specific Subnet

```bash
# Create network with custom subnet
docker network create \
  --driver bridge \
  --subnet 10.1.0.0/24 \
  --gateway 10.1.0.1 \
  --ip-range 10.1.0.128/25 \
  custom-net

# Create container with specific IP
docker run -d --name web \
  --network custom-net \
  --ip 10.1.0.100 \
  nginx

# Verify
docker inspect web --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
# Output: 10.1.0.100
```

---

### Example 5: Host Network for Performance

```bash
# Performance test with bridge network
docker run --rm \
  -p 8080:8080 \
  benchmark-app

# Performance test with host network
docker run --rm \
  --network host \
  benchmark-app

# Host network typically 10-20% faster
```

---

## Best Practices

### ✅ Do's

**1. Use custom bridge networks (not default bridge)**
```bash
# ❌ Bad - default bridge, no DNS
docker run -d --name app nginx

# ✅ Good - custom network, automatic DNS
docker network create my-net
docker run -d --name app --network my-net nginx
```

---

**2. Use container names for communication**
```bash
# ✅ Good - uses DNS
docker run -d --name db postgres
docker run -d --name app -e DB_HOST=db api-server

# ❌ Bad - hardcoded IP (brittle)
docker run -d --name app -e DB_HOST=172.17.0.2 api-server
```

---

**3. Isolate services with multiple networks**
```bash
# Database only on backend
docker network create backend
docker run --network backend postgres

# Web only on frontend
docker network create frontend
docker run --network frontend nginx

# API on both
docker run --network backend api
docker network connect frontend api
```

---

**4. Use specific subnets to avoid conflicts**
```bash
docker network create --subnet 10.10.0.0/24 my-net
```

---

**5. Name your networks descriptively**
```bash
# ✅ Good
docker network create app-frontend
docker network create app-backend
docker network create monitoring

# ❌ Bad
docker network create net1
docker network create net2
```

---

### ❌ Don'ts

**1. Don't use default bridge for production**
```bash
# ❌ No automatic DNS resolution
docker run -d nginx
```

**2. Don't hardcode IPs**
```bash
# ❌ IP might change on restart
-e DATABASE_URL=http://172.17.0.5:5432
```

**3. Don't expose all services to host**
```bash
# ❌ Database exposed to host unnecessarily
docker run -p 5432:5432 postgres

# ✅ Only expose web tier
docker run -p 80:80 nginx
```

**4. Don't use host network without good reason**
```bash
# ❌ Less secure, less portable
docker run --network host nginx

# ✅ Use bridge with port mapping
docker run -p 80:80 nginx
```

---

## Troubleshooting

### Container Can't Communicate

**Problem:** Container A can't reach Container B

**Diagnosis:**
```bash
# Check if on same network
docker inspect containerA --format='{{json .NetworkSettings.Networks}}' | jq
docker inspect containerB --format='{{json .NetworkSettings.Networks}}' | jq

# Test connectivity
docker exec containerA ping containerB
```

**Solutions:**

1. **Put on same network:**
   ```bash
   docker network connect my-network containerA
   docker network connect my-network containerB
   ```

2. **Check network isolation:**
   ```bash
   docker network inspect my-network --format='{{.Internal}}'
   # If true, no external access
   ```

---

### Can't Find Container IP

**Problem:** `docker inspect` shows empty IP

**Possible causes:**

1. **Container using host network:**
   ```bash
   docker inspect container --format='{{.HostConfig.NetworkMode}}'
   # If "host", container uses host's IP
   ```

2. **Container stopped:**
   ```bash
   docker ps -a | grep container
   # Start it first
   ```

3. **Container using none network:**
   ```bash
   docker inspect container --format='{{.HostConfig.NetworkMode}}'
   # If "none", no IP assigned
   ```

---

### Port Already in Use

**Problem:** Can't start container, port in use

**Diagnosis:**
```bash
# Check what's using port
sudo netstat -tlnp | grep :80
# or
sudo lsof -i :80
```

**Solutions:**

1. **Stop conflicting service:**
   ```bash
   docker stop <conflicting-container>
   ```

2. **Use different host port:**
   ```bash
   docker run -p 8080:80 nginx  # Map to 8080 instead
   ```

3. **Use host network (careful):**
   ```bash
   docker run --network host nginx
   ```

---

### Network Not Found

**Problem:** `Error: network not found`

**Check existing networks:**
```bash
docker network ls
```

**Create network:**
```bash
docker network create my-network
```

---

### DNS Not Resolving

**Problem:** Can't ping container by name

**Requirements for DNS:**
1. Must use custom bridge network (not default)
2. Containers must be on same network
3. Use container name or alias

**Fix:**
```bash
# Create custom network
docker network create my-net

# Put containers on it
docker network connect my-net container1
docker network connect my-net container2

# Now DNS works
docker exec container1 ping container2
```

---

## Network Commands Quick Reference

```bash
# List networks
docker network ls

# Create network
docker network create <name>
docker network create --driver bridge --subnet 192.168.1.0/24 <name>

# Inspect network
docker network inspect <network>
docker network inspect <network> --format='{{json .Containers}}' | jq

# Remove network
docker network rm <network>
docker network prune  # Remove all unused

# Connect container
docker network connect <network> <container>
docker network connect --ip 192.168.1.10 <network> <container>

# Disconnect container
docker network disconnect <network> <container>

# Find container IP
docker inspect <container> --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

# Get all IPs in network
docker network inspect <network> --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'

# Host network
docker run --network host <image>
```

---

## Summary

### Network Types

| Type | Use Case | Isolation | Performance | DNS |
|------|----------|-----------|-------------|-----|
| **bridge** | Most apps | ✅ Yes | Good | ✅ Yes (custom) |
| **host** | Performance | ❌ No | Best | ❌ No |
| **overlay** | Multi-host | ✅ Yes | Good | ✅ Yes |
| **macvlan** | Legacy apps | ✅ Yes | Best | ⚠️ Limited |
| **none** | Isolation | ✅ Maximum | N/A | ❌ No |

### Key Takeaways

1. **Use custom bridge networks** for automatic DNS
2. **Use container names** for communication, not IPs
3. **Use host network** only when needed (performance, many ports)
4. **Isolate tiers** with separate networks
5. **Use `docker network inspect`** to debug issues

---

## Additional Resources

- [Docker Networking Documentation](https://docs.docker.com/network/)
- [Container Networking](https://docs.docker.com/config/containers/container-networking/)
- [Network Drivers](https://docs.docker.com/network/drivers/)
- [Docker Network Commands](https://docs.docker.com/engine/reference/commandline/network/)
