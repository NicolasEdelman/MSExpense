FROM node:24-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
COPY prisma ./prisma
RUN pnpm prisma generate
EXPOSE 3000
CMD ["node", "dist/index.js"]