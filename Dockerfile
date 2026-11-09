# Noel OS — ein Image: baut das Frontend und startet den Server (API + Auslieferung)
FROM node:22-bookworm-slim

# Build-Tools für native Module (better-sqlite3) als Fallback, falls kein Prebuild
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Abhängigkeiten zuerst (besseres Caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Quellcode
COPY . .

# Frontend bauen (erzeugt dist/)
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

# Daten (SQLite, VAPID-Schlüssel) liegen in /app/data → als Volume mounten
VOLUME ["/app/data"]

CMD ["npx", "tsx", "server/index.ts"]
