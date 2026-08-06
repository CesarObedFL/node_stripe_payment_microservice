FROM node:20-slim

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy files and dependencies
COPY package.json pnpm-lock.yaml ./

# Install pnpm dependencies 
RUN pnpm install --frozen-lockfile

# Copy de code
COPY . .

EXPOSE 3200

CMD ["pnpm", "start"]