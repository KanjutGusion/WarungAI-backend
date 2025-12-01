# Stage: development
FROM node:20-alpine AS development

ARG DATABASE_URL

ENV NODE_ENV=development
WORKDIR /usr/src/app

# Copy package manifest(s)
COPY package*.json ./

# Use npm ci if lockfile exists, otherwise npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source
COPY . .

# Generate Prisma client
RUN DATABASE_URL=${DATABASE_URL} npx prisma generate

# Expose internal app port
EXPOSE 3000

# Default for development target (overridable in compose)
CMD ["npm", "run", "start:dev"]

# ---------------------------------------------------
# Build stage
FROM development AS build
RUN npm run build

# ---------------------------------------------------
# Production image
FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy package files and install only production deps
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy compiled dist
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000

# production start
CMD ["npm", "run", "start:prod"]
