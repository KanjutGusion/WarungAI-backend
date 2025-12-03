# 🏗️ Technical Architecture & Engineering Deep Dive

This document outlines the architectural decisions, security patterns, and DevOps pipeline used in **WarungSense AI**. It is designed to provide transparency into the engineering standards applied throughout the project.

## 📂 Project Structure

We follow a modular **NestJS** architecture to ensure separation of concerns and maintainability.

```bash
src
├── _common          # Global shared resources (Guards, Decorators, Filters)
├── auth             # JWT Authentication & Strategy
├── generated        # Custom output for Prisma Client (Optimization)
├── health           # Liveness/Readiness probes
├── nota             # Receipt processing logic
├── ocr              # OCR Engine integration
└── main.ts          # Application entry point
```

## 🛡️ Security Pattern: "Private by Default"

One of the core architectural decisions in this project is the Global Guard Strategy. Instead of manually protecting each route, we inverted the control: All routes are private by default.

### How it works

In `src/_common/common.module.ts`, we register the JwtGuard globally. This ensures no endpoint is accidentally left exposed.

```TypeScript

// src/_common/common.module.ts
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtGuard, // <--- Enforces security on EVERY route
  },
],
```

### The Custom JwtGuard Logic

Our JwtGuard (`src/_common/guards/jwt.guard.ts`) extends the standard Passport guard but adds a crucial logic layer. It centralizes Authentication (Who are you?) and Authorization (What can you do?) in a single execution context.

### The Execution Flow:

- Whitelist Check: It first checks if the handler is explicitly marked as `@Public()` using Reflect metadata.

- JWT Validation: If not public, it enforces strict JWT validation via super.`canActivate()`.

- Role-Based Access Control (RBAC): It automatically checks for @Roles() metadata to validate user permissions.

Code Snippet:

```TypeScript

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Whitelist: Is this route explicitly public?
    if (this._isPublicRoute(context)) {
      return true;
    }

    // 2. Authentication: Is the token valid?
    if (!(await this._validateJwt(context))) {
      return false;
    }

    // 3. Authorization: Does user have the required Role?
    return this._checkUserRole(context);
  }
}
```

Benefit: This prevents "forgotten auth" vulnerabilities (OWASP Top 10). If a developer creates a new endpoint and forgets to add a guard, it is secure by default and returns 401 Unauthorized.

## 🚀 DevOps & CI/CD Pipeline

We utilize a robust CI/CD pipeline using GitHub Actions, GHCR (Container Registry), and Docker Compose with Profiles.

1. The Pipeline Flow
   1. The deployment process is automated to ensure reliability and consistency:

   2. Update tag on main: Triggers the workflow.

   3. Build: Creates a Docker image using multi-stage builds.

   4. Push: Uploads the image to GitHub Container Registry (GHCR).

   5. Deploy: SSH into the VPS and executes the deployment script.

2. Docker Strategy (Profiles)
   1. We use Docker Compose Profiles to separate environments in a single docker-compose.yml file. This prevents development services (like local DBs) from running in production.

   2. Profile dev: Runs API, PostgreSQL, and mounts local volumes.

   3. Profile prod: Runs the optimized production image pulled from GHCR.

   4. Deployment Script Strategy:

```YAML

# GitHub Actions deployment step
script: |
  # IMAGE_TAG obtained from github actions
  export IMAGE_TAG=${{ github.ref_name }}
  echo "🚀 Deploying version: $IMAGE_TAG"

  # 2. Pull latest code (docker-compose.yml may changed) & image
  IMAGE_TAG=$IMAGE_TAG docker compose -f docker-compose.yml --profile prod pull

  # 3. Restart Containers (Zero-downtime strategy attempt)
  # Only services marked with profiles: ["prod"] will start
  IMAGE_TAG=$IMAGE_TAG docker compose -f docker-compose.yml --profile prod up -d --force-recreate
```

### ⚡ Performance & Optimization

Bun Runtime: We chose Bun over Node.js for faster startup times and package installation, critical for serverless-like cold starts and rapid development iteration.

Prisma Generation: We utilize a custom output path for Prisma Client (generated/prisma) to ensure type safety works seamlessly across Docker stages and strict TypeScript configurations (rootDir vs baseUrl).

Multi-Stage Build: Our Dockerfile uses multi-stage builds to ensure the final production image contains only the necessary artifacts (dist folder) and production dependencies, keeping the image size lightweight.
