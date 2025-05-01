# Memo - Installation Script (PowerShell)

Write-Host "🚀 Setting up Memo App..." -ForegroundColor Cyan

# Install NPM dependencies
Write-Host "📦 Installing Node dependencies..." -ForegroundColor Cyan
npm install

# Create environment file
Write-Host "🔑 Creating .env file template..." -ForegroundColor Cyan
$envContent = @"
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here
"@

Set-Content -Path ".env" -Value $envContent

# Install Python dependencies
Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Cyan
if (Test-Path -Path "server") {
    Push-Location -Path "server"
    try {
        pip install -r requirements.txt
    }
    catch {
        Write-Host "Failed to install using pip, trying pip3..." -ForegroundColor Yellow
        try {
            pip3 install -r requirements.txt
        }
        catch {
            Write-Host "❌ Failed to install Python dependencies. Please install them manually." -ForegroundColor Red
        }
    }
    Pop-Location
}
else {
    Write-Host "❌ Server directory not found. Skipping Python dependencies." -ForegroundColor Red
}

Write-Host "✅ Setup complete! Run 'npm start' to start the app." -ForegroundColor Green 