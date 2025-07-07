# metalab-drinks-backend
This project contains the backend code for the Metadrinks project.

## Setting up
Copy the contents of `.env.example` to `.env` and replace the values accordingly.

### docker-compose.yml

```
---
services:
  postgres:
    image: postgres:17-alpine
    container_name: metadrinks-postgres
    environment:
      - TZ=Europe/Vienna
      - POSTGRES_USER=<DB_USER>
      - POSTGRES_PASSWORD=<DB_PASSWORD>
      - POSTGRES_DB=<DB_DATABASE>
    volumes:
      - ./pg_data:/var/lib/postgresql/data
    networks:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U <DB_USER> -d <DB_DATABASE>"]
      interval: 1s
      retries: 10
      start_period: 10s
      timeout: 30s

  backend:
    image: ghcr.io/metalab/Metadrinks-backend:main
    container_name: metadrinks-backend
    networks:
      - backend
    ports:
      - 8080:8080
    depends_on:
      postgres:
        condition: service_healthy
        restart: true
    restart: unless-stopped

networks:
  backend:
```

Using this example, your `DB_HOST` would be `metadrinks-postgres`, your `DB_PORT` would be `5432` and everything else would be what you replace the placeholder values with.

## Usage

### API Docs
coming soon (when the api is semi-stable and tested)