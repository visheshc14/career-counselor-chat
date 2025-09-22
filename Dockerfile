# ---- base ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---- deps ----
FROM base AS deps

COPY package*.json ./
RUN npm ci

# ---- build ----
FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY . .

RUN npm run build

# ---- runtime ----
FROM base AS runtime

RUN addgroup -S next && adduser -S next -G next
USER next
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/.next /app/.next
COPY --from=build /app/public /app/public
COPY package*.json next.config.mjs ./
EXPOSE 3000
CMD ["npm", "start"]
