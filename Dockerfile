# Multi-stage build for DevPockit static export
# Stage 1: Build
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Optional: override base URL for self-hosting (e.g. --build-arg NEXT_PUBLIC_BASE_URL=https://mytools.example.com)
ARG NEXT_PUBLIC_BASE_URL=https://devpockit.hypkey.com
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

RUN pnpm build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/out /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
