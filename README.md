# 🏪 WarungSense AI

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

3.  **Run with Docker (Dev Mode)**
    This will spin up the Backend API + PostgreSQL Database automatically.

    ```bash
    docker compose --profile dev up --build -d
    ```

4.  **Access the App**
    - API Health Check: `http://localhost:3001/api/v1/health`
    - Swagger Documentation: `http://localhost:3001/api/docs`

---

### 🤓 For Developers & Judges

Interested in the architecture, security patterns, and DevOps pipeline?
👉 **[READ THE TECHNICAL.md](./TECHNICAL.md)** for a deep dive into our code quality and CI/CD strategies.
