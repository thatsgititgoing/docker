# CMD vs ENTRYPOINT in Docker

This directory demonstrates the differences between `CMD` and `ENTRYPOINT` instructions in Dockerfiles and how they interact.

## Overview

Contains three Dockerfile examples showcasing different combinations of CMD and ENTRYPOINT instructions using simple Alpine Linux containers.

## Files

| File | Description |
|------|-------------|
| [Dockerfile](Dockerfile) | Uses both ENTRYPOINT and CMD together |
| [Dockerfile.cmd](Dockerfile.cmd) | Uses only CMD instruction |
| [Dockerfile.entrypoint](Dockerfile.entrypoint) | Uses only ENTRYPOINT instruction |

## Key Differences

### CMD Only ([Dockerfile.cmd](Dockerfile.cmd))

```dockerfile
FROM alpine:3.20
CMD ["echo", "hello from CMD in Dockerfile.cmd"]
```

- **Behavior**: Defines the default command to run
- **Override**: Can be completely replaced by arguments to `docker run`
- **Use case**: When you want users to easily override the entire command

**Examples:**
```bash
# Uses default CMD
docker build -f Dockerfile.cmd -t cmd-demo .
docker run cmd-demo
# Output: hello from CMD in Dockerfile.cmd

# Override CMD completely
docker run cmd-demo echo "custom message"
# Output: custom message

# Run different command
docker run cmd-demo ls /etc
# Output: lists files in /etc
```

### ENTRYPOINT Only ([Dockerfile.entrypoint](Dockerfile.entrypoint))

```dockerfile
FROM alpine:3.20
ENTRYPOINT ["echo", "hello from ENTRYPOINT in Dockerfile.cmd"]
```

- **Behavior**: Sets a fixed command that always runs
- **Override**: Arguments to `docker run` are appended to ENTRYPOINT
- **Use case**: When the container should always run a specific executable

**Examples:**
```bash
# Uses ENTRYPOINT
docker build -f Dockerfile.entrypoint -t entrypoint-demo .
docker run entrypoint-demo
# Output: hello from ENTRYPOINT in Dockerfile.cmd

# Arguments are APPENDED to ENTRYPOINT
docker run entrypoint-demo "and additional text"
# Output: hello from ENTRYPOINT in Dockerfile.cmd and additional text

# Override ENTRYPOINT (requires --entrypoint flag)
docker run --entrypoint ls entrypoint-demo /etc
# Output: lists files in /etc
```

### ENTRYPOINT + CMD ([Dockerfile](Dockerfile))

```dockerfile
FROM alpine:3.20
ENTRYPOINT ["echo"]
CMD ["DEFAULT MESSAGE"]
```

- **Behavior**: ENTRYPOINT is the main command, CMD provides default arguments
- **Override**: `docker run` arguments replace CMD but not ENTRYPOINT
- **Use case**: Fixed executable with configurable default parameters

**Examples:**
```bash
# Uses ENTRYPOINT + default CMD
docker build -t entrypoint-cmd-demo .
docker run entrypoint-cmd-demo
# Output: DEFAULT MESSAGE

# Override CMD (arguments replace CMD, not ENTRYPOINT)
docker run entrypoint-cmd-demo "custom message"
# Output: custom message

# ENTRYPOINT (echo) is always used
docker run entrypoint-cmd-demo "hello" "world"
# Output: hello world
```

## Comparison Table

| Aspect | CMD Only | ENTRYPOINT Only | ENTRYPOINT + CMD |
|--------|----------|-----------------|------------------|
| Default behavior | Runs specified command | Runs specified command | Runs ENTRYPOINT with CMD args |
| `docker run` args | Replace entire CMD | Appended to ENTRYPOINT | Replace CMD, appended to ENTRYPOINT |
| Easy to override | Yes | Requires `--entrypoint` | CMD args easily overridden |
| Use case | Flexible containers | Fixed-purpose containers | Fixed command, flexible arguments |

## Best Practices

1. **Use ENTRYPOINT** when your container is a command-line tool or should always run a specific executable
2. **Use CMD** when you want maximum flexibility for users to override behavior
3. **Use ENTRYPOINT + CMD** when you have a fixed executable but want to provide default arguments that users can easily override
4. **Always use JSON array format** (`["executable", "param"]`) rather than string format for proper signal handling

## Quick Reference

```bash
# Build all examples
docker build -f Dockerfile.cmd -t cmd-demo .
docker build -f Dockerfile.entrypoint -t entrypoint-demo .
docker build -t entrypoint-cmd-demo .

# Test each example
docker run cmd-demo
docker run entrypoint-demo
docker run entrypoint-cmd-demo

# Test with custom arguments
docker run cmd-demo echo "test"
docker run entrypoint-demo "test"
docker run entrypoint-cmd-demo "test"
```

## Notes

- Both CMD and ENTRYPOINT support two forms: shell form and exec form (JSON array)
- Exec form (JSON array) is preferred as it doesn't invoke a shell and properly handles signals
- Only the last CMD or ENTRYPOINT instruction in a Dockerfile takes effect
