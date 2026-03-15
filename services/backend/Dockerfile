FROM node:24-alpine
WORKDIR /app

ARG DATABASE_URL=postgresql://app:app@postgres:5432/app?schema=public
ENV DATABASE_URL=${DATABASE_URL}

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm install && npm prune --omit=dev

COPY src ./src

EXPOSE 3000
CMD ["npm", "start"]
