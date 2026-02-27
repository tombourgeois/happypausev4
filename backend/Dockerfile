# Stage 1: build
FROM node:22-slim AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build && cp src/db/schema.sql dist/db/

# Stage 2: production
FROM node:22-slim

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p public/uploads public/images/activityimages

EXPOSE 3000
CMD ["node", "dist/index.js"]
