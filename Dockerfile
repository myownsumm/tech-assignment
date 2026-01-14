# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_API_BASE_URL
ARG VITE_API_ACCESS_TOKEN

# Set as environment variables for Vite build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_ACCESS_TOKEN=$VITE_API_ACCESS_TOKEN

# Copy package files first to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a custom Nginx config for SPA routing (redirects 404s to index.html)
# We use a heredoc (<<EOF) for cleaner syntax
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

# Explicitly expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]