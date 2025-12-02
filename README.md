# WarungAI Backend

<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">
  A backend service built using the NestJS framework, running on Bun and integrated with PostgreSQL via Prisma.
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank">
    <img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank">
    <img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" />
  </a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank">
    <img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" />
  </a>
  <a href="https://circleci.com/gh/nestjs/nest" target="_blank">
    <img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" />
  </a>
</p>

---

## Description

This repository contains the backend for **WarungAI**, a system designed to provide AI-powered tools for micro–retail businesses.

Built with:

* **NestJS** (server framework)
* **Bun** (runtime + package manager)
* **Prisma** (ORM)
* **PostgreSQL** (database)

---

## Project Setup

Install dependencies:

```bash
bun install
```

Create your environment file:

```bash
cp .env.example .env
```

Required variables include:

* `HOST_PORT`
* `JWT_SECRET`
* `DATABASE_URL` From https://www.prisma.io/
* `KOLOSAL_API_KEY` From https://kolosal.ai/

---

## Database Setup (Prisma)

Apply migrations:

```bash
bunx prisma migrate deploy
```

Seed initial roles and data:

```bash
bunx prisma db seed
```

---

## Compile and Run the Project

### Development

```bash
bun run start:dev
```

### Production (Local)

```bash
bun run start:prod
```

### Production (Docker Compose)

The repository includes a production-ready Docker Compose configuration:

```bash
docker compose up -d
```

The API will run on:

```
http://localhost:<HOST_PORT>
```

---

## API Documentation

A global prefix is used:

```
/api/v1
```

When the application starts, it logs the documentation path:

```
http://localhost:<HOST_PORT>/api/docs
```

---

## Additional Resources (NestJS)

Useful references when working with NestJS:

* Official Docs: [https://docs.nestjs.com](https://docs.nestjs.com)
* Discord Community: [https://discord.gg/G7Qnnhy](https://discord.gg/G7Qnnhy)
* DevTools: [https://devtools.nestjs.com](https://devtools.nestjs.com)
* Courses: [https://courses.nestjs.com](https://courses.nestjs.com)

---

## Support

Nest is an MIT-licensed open-source framework. See more at:

[https://docs.nestjs.com/support](https://docs.nestjs.com/support)

---

## License

This project is licensed under the MIT License.
