#!/bin/bash

# Deploy script for Travel Planner app
# Usage: ./deploy.sh your-vm-ip-address your-ssh-username

# Check if IP address is provided
if [ -z "$1" ]; then
  echo "Please provide your VM IP address as the first argument"
  echo "Usage: ./deploy.sh your-vm-ip-address your-ssh-username"
  exit 1
fi

# Check if SSH username is provided
if [ -z "$2" ]; then
  echo "Please provide your SSH username as the second argument"
  echo "Usage: ./deploy.sh your-vm-ip-address your-ssh-username"
  exit 1
fi

VM_IP=$1
SSH_USER=$2
REMOTE_DIR="/home/$SSH_USER/travel-planner"

echo "Deploying backend to $SSH_USER@$VM_IP..."

# First, create a production build of the backend
echo "Preparing backend for deployment..."

# Create backend production folder
mkdir -p backend-deploy
cp -r backend/* backend-deploy/
cp -r backend/.env backend-deploy/
cd backend-deploy

# Install production dependencies only
npm ci --production

# Package the backend
tar -czf ../backend-package.tar.gz .
cd ..

# Create remote directory if it doesn't exist
ssh $SSH_USER@$VM_IP "mkdir -p $REMOTE_DIR"

# Copy backend package to VM
echo "Uploading backend to VM..."
scp backend-package.tar.gz $SSH_USER@$VM_IP:$REMOTE_DIR/

# Extract and set up backend on VM
echo "Setting up backend on VM..."
ssh $SSH_USER@$VM_IP << EOF
  cd $REMOTE_DIR
  rm -rf backend
  mkdir -p backend
  tar -xzf backend-package.tar.gz -C backend
  cd backend
  
  # Check if PM2 is installed, if not install it
  if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
  fi
  
  # Stop existing PM2 process if it exists
  pm2 stop travel-planner-api 2>/dev/null || true
  
  # Start the backend with PM2
  pm2 start server.js --name travel-planner-api
  
  # Save PM2 process list to start on reboot
  pm2 save
EOF

# Clean up
rm -rf backend-deploy
rm backend-package.tar.gz

echo "Deployment complete!"
echo ""
echo "Your backend is now running at: http://$VM_IP:5000"
echo "Make sure to update your frontend API URL to point to this address" 