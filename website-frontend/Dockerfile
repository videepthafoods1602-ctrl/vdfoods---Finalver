# Stage 1: Build Stage
FROM node:20-alpine AS build

# Set work directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json /app/
RUN npm install

# Copy project files
COPY . /app/

# Build argument for API URL
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

# Build the application
RUN npm run build

# Stage 2: Production Stage (Nginx)
FROM nginx:stable-alpine

# Copy the build output from the previous stage to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SAP routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
