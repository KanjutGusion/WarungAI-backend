# WarungSense AI

---

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

> **Empowering Indonesian MSMEs (Warung) with AI-Driven Insights.**
> _From dusty receipts to data-driven profitability._

<!-- ![Banner Image Placeholder](https://via.placeholder.com/1200x400?text=WarungSense+AI+Dashboard) -->

## The Problem

Traditional "Warungs" in Indonesia struggle with financial tracking. They rely on piles of handwritten notes, making it impossible to calculate true profit, track inventory, or determine competitive pricing. They are losing against modern retail chains.

## The Solution

**WarungSense AI** transforms a simple smartphone camera into a powerful business consultant.

1.  **Snap:** Upload a photo of any receipt/nota.
2.  **Parse:** Our AI extracts items, quantities, and prices automatically.
3.  **Analyze:** Get instant profit calculations and AI-driven pricing recommendations based on location.

## Key Features

- **Smart OCR Engine:** Converts unstructured receipt images into structured JSON data.
- **AI Pricing Agent:** Analyzes your location and competitors to suggest the _perfect_ selling price to maximize margin.
- **Real-time Dashboard:** View daily turnover (Omzet) and profit analysis instantly.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) (Ultra-fast JavaScript runtime)
- **Framework:** NestJS (Scalable Server-side Architecture)
- **Database:** PostgreSQL + Prisma ORM
- **Infrastructure:** Docker, GitHub Actions, GHCR.

## Getting Started (Fast Track)

We use Docker to make running this app effortless.

### Prerequisites

- Docker & Docker Compose
- Node.js / Bun (Optional, for local scripts)

### Installation

1.  **Clone the Repo**

    ```bash
    git clone https://github.com/kanjutgusion/warungai-backend.git
    cd warungai-backend
    ```

2.  **Setup Environment**

    ```bash
    cp .env.example .env
    # Fill in your database credentials and API keys
    ```

3.  (a) **Run with Normal Bun**
    You must have postgres instance running somewhere and add the conn string on the `.env` file.

    ```bash
    bun i

    bunx prisma db push

    bunx prisma generate

    bun run build

    bun start
    ```

4.  (b) **Run with Docker (Dev Profile)**
    This will spin up the Backend API + PostgreSQL Database automatically.
    Also make sure your docker is running

    ```bash
    docker compose --profile dev up --build -d
    ```

5.  **Access the App**
    - API Health Check: `http://localhost:3001/api/v1/health`
    - Swagger Documentation: `http://localhost:3001/api/docs`

---

### For Developers & Judges

Interested in the architecture, security patterns, and DevOps pipeline?
**[READ THE TECHNICAL.md](./TECHNICAL.md)** for a deep dive into our code quality and CI/CD strategies.

---

## Additional Resources (NestJS)

Useful references when working with NestJS:

- Official Docs: [https://docs.nestjs.com](https://docs.nestjs.com)
- Discord Community: [https://discord.gg/G7Qnnhy](https://discord.gg/G7Qnnhy)
- DevTools: [https://devtools.nestjs.com](https://devtools.nestjs.com)
- Courses: [https://courses.nestjs.com](https://courses.nestjs.com)

---

## Support

Nest is an MIT-licensed open-source framework. See more at:

[https://docs.nestjs.com/support](https://docs.nestjs.com/support)

---

## License

This project is licensed under the MIT License.
