FROM node:24-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
COPY prisma ./prisma
RUN pnpm prisma generate
RUN pnpm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]