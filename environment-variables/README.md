# Environment Variables in Docker

This directory demonstrates various methods of setting and using environment variables in Docker containers.

## Overview

A simple Node.js Express application that showcases different ways to configure environment variables:
- Hardcoded in Dockerfile using `ENV`
- Using `.env` files for different environments
- Runtime configuration via `docker run -e` or `--env-file`

## Files

- [Dockerfile](Dockerfile) - Contains base image configuration with default ENV values
- [.env.dev](.env.dev) - Development environment variables
- [.env.prod](.env.prod) - Production environment variables
- [src/index.js](src/index.js) - Express app that uses PORT and APP_NAME environment variables

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Port number the application listens on |
| APP_NAME | "My Awesome Application" | Application name displayed in responses |

## Usage

### Build the Image

```bash
docker build -t env-demo .
```

### Run with Default Environment Variables

Uses the ENV values defined in the Dockerfile:

```bash
docker run -p 3000:3000 env-demo
```

### Run with Development Environment

```bash
docker run -p 3000:3000 --env-file .env.dev env-demo
```

### Run with Production Environment

```bash
docker run -p 9000:9000 --env-file .env.prod env-demo
```

### Run with Custom Environment Variables

```bash
docker run -p 8080:8080 -e PORT=8080 -e APP_NAME="Custom App" env-demo
```

## Testing

After starting the container, test the application:

```bash
curl http://localhost:3000
```

Expected response: `Hello from My Awesome Application!` (or your configured APP_NAME)

## Key Concepts

1. **ENV in Dockerfile**: Sets default values at build time
2. **--env-file**: Loads environment variables from a file at runtime
3. **-e flag**: Sets individual environment variables at runtime
4. **Runtime overrides build time**: Variables set with `-e` or `--env-file` override Dockerfile ENV values

## Notes

- Never commit sensitive data in `.env` files to version control
- Use `.dockerignore` to exclude environment files from the build context when appropriate
- Environment variables set at runtime take precedence over those defined in the Dockerfile
