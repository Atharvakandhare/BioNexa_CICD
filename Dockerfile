# Stage 1: Build React App
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve using NGINX
FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
