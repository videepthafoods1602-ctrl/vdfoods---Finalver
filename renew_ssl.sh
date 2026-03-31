#!/bin/bash

# SSL Renewal Script for Videeptha Foods
# This script triggers the Certbot container to renew certificates
# and then reloads Nginx in the frontend container.

# Configuration
PROJECT_DIR="/root/vdfoods-finalver/vdfoods---Finalver"

# Move to the project directory
cd "$PROJECT_DIR" || exit

# 1. Run the Certbot container
# The 'up' command will start the container, and since it's configured 
# for 'certonly', it will check and renew if close to expiration.
echo "[$(date)] Starting SSL renewal process..."
docker compose up certbot

# 2. Reload Nginx configuration without stopping the container
# This ensures that the new certificates are picked up without downtime.
echo "[$(date)] Reloading Nginx configuration..."
docker compose exec frontend nginx -s reload

echo "[$(date)] SSL renewal complete."
