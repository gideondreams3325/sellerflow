# Production Dockerfile for SellerFlow Express Node.js Backend
FROM node:22-slim

# Set environment
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install dependencies
COPY package*.json ./
RUN npm install --include=dev

# Copy application files
COPY . .

# Build assets for dist/
RUN npm run build

# Expose default Cloud Run / container port
EXPOSE 8080

# Launch SellerFlow Express server
CMD ["node", "server.js"]
