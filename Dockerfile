FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build production
RUN npm run build

# Serve static build dengan serve
RUN npm install -g serve

CMD ["serve", "-s", "dist", "-l", "3000"]
