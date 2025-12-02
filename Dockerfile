# ---------------------------------------------------
# Stage 1: Development
# ---------------------------------------------------
FROM oven/bun:1 AS development

# Needed by bun
# RUN apt-get update -y && apt-get install -y openssl

ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=development

WORKDIR /usr/src/app

COPY package.json bun.lockb* ./
RUN bun install --ignore-scripts

COPY . .

# Generate Prisma Client ke custom path: src/generated/prisma
RUN bunx prisma generate

EXPOSE 3000
CMD ["bun", "run", "start:dev"]

# ---------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------
FROM development AS build

# Build akan include generated prisma client
RUN bun run build

# ---------------------------------------------------
# Stage 3: Production
# ---------------------------------------------------
FROM oven/bun:1 AS production

# Needed by bun
RUN apt-get update -y && apt-get install -y openssl

ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Install production dependencies
COPY package.json bun.lockb* ./
RUN bun install --production --ignore-scripts

# Copy prisma schema
COPY prisma ./prisma

# Copy source code yang berisi generated prisma
# Karena output ada di src/generated/prisma
COPY src ./src

# Generate Prisma Client (akan generate ke src/generated/prisma)
RUN bunx prisma generate

# Copy build output (dist sudah include reference ke generated prisma)
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000
CMD ["bun", "run", "start:prod"]