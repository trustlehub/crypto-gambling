
# Stage 1: Build the React application
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

RUN npm run build

RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

CMD ["serve", "-s", "build"]
