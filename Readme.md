# Career Counselor

A sleek, minimal chat app for practical career guidance. Built with **Next.js 14**, **tRPC**, **Drizzle ORM (Postgres)**, **NextAuth (Credentials)**, and **Tailwind**. Global dark mode, elegant cards/inputs, Markdown replies, and fast UX.

Made By Vishesh

<img width="1591" height="963" alt="Screenshot 2025-09-22 at 4 35 49 PM" src="https://github.com/user-attachments/assets/56b15484-8408-48a6-b5d8-4603f6672f9f" />

<img width="1578" height="969" alt="Screenshot 2025-09-22 at 4 36 24 PM" src="https://github.com/user-attachments/assets/49d91364-2afe-46b9-a31f-dcf69ec8260b" />

<img width="1578" height="968" alt="Screenshot 2025-09-22 at 4 36 45 PM" src="https://github.com/user-attachments/assets/8a4c0e77-5d2f-4446-a5d4-859d8e7f376a" />

<img width="1576" height="993" alt="Screenshot 2025-09-22 at 4 37 27 PM" src="https://github.com/user-attachments/assets/da47ed40-1897-4f2f-bd51-94c0a45df571" />

<img width="1525" height="997" alt="Screenshot 2025-09-22 at 4 38 50 PM" src="https://github.com/user-attachments/assets/843b023a-7f08-4066-bc82-b0673f93d0d0" />

<img width="1559" height="986" alt="Screenshot 2025-09-22 at 4 39 11 PM" src="https://github.com/user-attachments/assets/88b9c8a2-7278-4310-87a1-121f6f0e0b76" />

<img width="1476" height="979" alt="Screenshot 2025-09-22 at 4 41 40 PM" src="https://github.com/user-attachments/assets/84729803-6b16-4b44-b367-cd15e21d1873" />


https://github.com/user-attachments/assets/1fdec2ac-9801-49c5-a021-b6d746a9aa50


---

##  Features

- Clean, minimal UI (light/dark) with a **global Theme Toggle**
- Chat with:
  - Sessions sidebar (create / **wipe & create** fresh)
  - Optimistic send + **message status** (sending / sent / read / failed)
  - High-contrast Markdown bubbles (tuned for dark mode)
- Auth with **NextAuth (Credentials)** + bcrypt
- **Banners** on:
  - Sign out → `/?signout=1`
  - Sign-up success → `/?registered=1`
  - Idle timeout (default 2 min) → `/?expired=1`
- LLM routing: **OpenRouter** primary (auto-rotate models on 429) → optional **OpenAI** fallback

---

## Tech Stack

- **Next.js 14** (Pages Router) • **TypeScript**
- **tRPC** + **@tanstack/react-query**
- **Drizzle ORM** + **postgres-js** (Postgres)
- **NextAuth (Credentials)** + **bcrypt**
- **TailwindCSS** (custom tokens in `globals.css`)
- LLM: **OpenRouter** (primary) → **OpenAI** (optional fallback)

---
## Quickstart

### 1) Env
Create `.env.local`:

```env
# App
NEXTAUTH_SECRET=your-long-random-string
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Career Counselor
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/career_db

# LLM (optional but recommended)
OPENROUTER_API_KEY=...
# OPENROUTER_MODEL=openai/gpt-oss-120b:free
# OPENROUTER_ALT_MODELS=deepseek/deepseek-chat,meta-llama/llama-3.1-8b-instruct:free,google/gemma-2-9b-it:free,mistralai/mistral-7b-instruct:free
# OPENAI_API_KEY=...
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_PROJECT=...
```

### 2) Install & DB
```bash
npm i

Generate & run migrations (adjust to your drizzle setup)
// npx drizzle-kit generate
// npx drizzle-kit migrate 
 ```
 - Tables live in src/db/schema.ts:
	 • users (id, email, name, passwordHash)
	 • chat_sessions (id, userId, title, createdAt)
	 • messages (id, sessionId, role, content, createdAt)

### 3) Run
```bash
npm run dev
# open http://localhost:3001
```

### 4) Accounts
	 • Sign up via /auth/signup → POST /api/auth/signup (bcrypt hashed)
	 • Sign in via NextAuth Credentials → /auth/signin


### Commands 
```bash
npm run dev     # local dev
npm run build   # production build
npm start       # run prod server
```
### Files you should have

Dockerfile
docker-compose.yml
db/
└─ init/
   └─ 01_schema.sql  # optional bootstrap SQL executed on first run


### **Docker-Compose.yml**
```yml
version: "3.9"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: career_db
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d career_db"]
      interval: 5s
      timeout: 3s
      retries: 10

  web:
    build: .
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - .env
    ports:
      - "3001:3000"

volumes:
  db_data:
```

#### **Dockerfile**

```Dockerfile
# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

#### **Bootstrap SQL example** (db/init/01_schema.sql)
```sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Docker Build & Start
```bash
docker compose up -d --build
# Open http://localhost:3001
```

## Handy
```bash
# Tail logs
docker compose logs -f web
docker compose logs -f db

# Restart only the app
docker compose restart web

# psql into the DB
docker exec -it $(docker ps -qf "name=_db_") psql -U user -d career_db

# Stop everything
docker compose down

# Wipe volumes and reapply db/init SQL (DANGER: deletes data)
docker compose down -v
docker compose up -d --build
```

### LLM Behavior

src/server/routers/chat.ts → callLLM():
	• Try OpenRouter (primary + auto rotation on 429)
	• Optional OpenAI fallback
	• Friendly final fallback string (never throws)

Set OPENROUTER_API_KEY (and APP_URL, NEXT_PUBLIC_APP_NAME) for free lanes attribution.

### Session Logic
	• Wipe & create: Header button calls chat.wipeAndCreate to delete all sessions + messages for the current user, then creates one fresh session.

	• Idle expiry: Implemented in _app.tsx (visibility/idle listeners). Default 2 min → redirect to / with ?expired=1 banner. Tweak the constant there if needed.

### Deploy (Vercel)
	• Add env vars from .env.local

	• Provision Postgres (Neon, Supabase, RDS, etc.)

	• Run Drizzle migrations (CI step or one-off)

	• Ensure APP_URL matches your Vercel URL for OpenRouter attribution  

### Troubleshooting
	• “Email already in use”: Unique constraint on users.email.

	• No LLM reply: Missing OPENROUTER_API_KEY/rate-limited; OpenAI fallback requires OPENAI_API_KEY.

	• Styles error: Tailwind class typos will fail the build. Check src/styles/globals.css.

	• Banners not showing: Redirects must include ?signout=1 / ?registered=1 / ?expired=1. Chat pages use signOut({ redirect: false }) then window.location.href = "/?signout=1".      

### Notes
	• LLM: src/server/routers/chat.ts includes callLLM with OpenRouter primary (rotates on 429) and optional OpenAI fallback.

	• Wipe & create: chat.wipeAndCreate deletes all sessions/messages for the current user in a transaction, then inserts a fresh one.

	• Idle timeout: _app.tsx listens for inactivity/visibility; default 2-minute idle pushes /?expired=1.

    • Banners: index.tsx reads and clears ?signout=1, ?registered=1, ?expired=1 to show one-time status cards.

	• Docker: docker-compose.yml runs Postgres (db) and the Next app (web). DATABASE_URL for the app uses host db.

	• Styles: all shared UI primitives (cards, inputs, buttons, badges) live in globals.css component layer to keep a consistent, minimal look.
