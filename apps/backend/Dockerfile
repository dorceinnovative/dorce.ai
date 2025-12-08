FROM node:18-bullseye

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies using npm (more reliable for Railway)
RUN npm install

# Copy source code
COPY . .

# Set environment variables for Railway
ENV NODE_ENV=production
ENV PORT=4000

# Generate Prisma client
RUN npm run prisma:generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start:prod"]