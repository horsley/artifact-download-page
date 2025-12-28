FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the default port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
