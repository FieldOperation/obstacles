# PowerShell script to create .env file for Supabase
# Run this in the backend directory: .\setup-env.ps1

$envContent = @"
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
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host "⚠️  Remember to change JWT_SECRET in production!" -ForegroundColor Yellow
