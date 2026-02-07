#!/bin/bash

# Setup script for backend environment variables
# This creates the .env file with Supabase configuration

cat > .env << EOF
# Database - Supabase
# Note: @ symbols in password are URL encoded as %40
DATABASE_URL="postgresql://postgres.uarbweqbrdcqtvmyzmvb:Fo%402026%402027@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# CORS
CORS_ORIGIN="http://localhost:3000"
EOF

echo "✅ .env file created successfully!"
echo "⚠️  Remember to change JWT_SECRET in production!"
