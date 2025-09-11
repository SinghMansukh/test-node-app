FROM node:18-alpine

COPY . /app
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies (use npm install if there's no package-lock.json)
RUN npm install --only=production

# Copy the rest of your application code
COPY . .

# Run your app
CMD ["node", "server.js"]
