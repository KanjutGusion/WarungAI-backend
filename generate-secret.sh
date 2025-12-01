#!/bin/bash

ENV_FILE=".env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

# Generate JWT_SECRET if empty
if ! grep -q "JWT_SECRET=.\+" "$ENV_FILE"; then
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$ENV_FILE"
    echo "Generated JWT_SECRET"
fi

echo "✅ Secrets ready!"