FROM node:18-alpine
WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json ./
COPY .npmrc ./
RUN npm ci --only=production

# Copy application source
COPY . .

ENV NODE_ENV=production \
    PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]

