# FROM node:18-alpine

# COPY . /app
# WORKDIR /app

# # Copy package.json and package-lock.json (if exists)
# COPY package*.json ./

# # Install dependencies (use npm install if there's no package-lock.json)
# RUN npm install --only=production

# # Copy the rest of your application code
# COPY . .

# # Run your app
# CMD ["node", "server.js"]


# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 3000
CMD ["node", "server.js"]
