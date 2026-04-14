FROM node:24-alpine AS build
WORKDIR /app

ARG DATABASE_URL=postgresql://app:app@postgres:5432/app?schema=public
ENV DATABASE_URL=${DATABASE_URL}

COPY package*.json ./
COPY tsconfig.json ./tsconfig.json
COPY prisma.config.ts ./prisma.config.ts
COPY prisma ./prisma
RUN npm install

COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
