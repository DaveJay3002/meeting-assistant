# Start both the Python server and Expo app
Write-Host "Starting Memo application..." -ForegroundColor Cyan

# Check if Python dependencies are installed
$pythonCheck = python -c "import flask, eventlet" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    cd server
    pip install -r requirements.txt
    cd ..
}

# Create two background jobs
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\server
    python app.py
}

# Start Expo in the current terminal
Write-Host "Starting Expo development server..." -ForegroundColor Green
Write-Host "Python server is running in the background." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop all processes when done." -ForegroundColor Yellow

try {
    npx expo start
}
finally {
    # Cleanup the server job when script exits
    if ($serverJob) {
        Stop-Job -Job $serverJob
        Remove-Job -Job $serverJob
        Write-Host "Server job stopped." -ForegroundColor Cyan
    }
} 