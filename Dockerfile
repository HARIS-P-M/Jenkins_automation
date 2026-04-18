# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE="http://localhost:4000/api"
ARG VITE_GOOGLE_API_KEY=""
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_GOOGLE_API_KEY=${VITE_GOOGLE_API_KEY}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
