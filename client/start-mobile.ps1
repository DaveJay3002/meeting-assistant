# Start both the Python server and Expo app with mobile-friendly configuration
Write-Host "Starting Memo application for mobile devices..." -ForegroundColor Cyan

# Check if Python dependencies are installed
$pythonCheck = python -c "import flask, eventlet" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    cd server
    pip install -r requirements.txt
    cd ..
}

# Get the current IP address to display for mobile connection
$ipAddress = (Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4" -and $_.PrefixOrigin -ne "WellKnown"} | Sort-Object InterfaceIndex | Select-Object -First 1).IPAddress

Write-Host "Your local IP address is: $ipAddress" -ForegroundColor Green
Write-Host "Make sure your mobile device is on the same WiFi network" -ForegroundColor Yellow

# Create a background job for the server
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\server
    python app.py
}

# Start Expo with mobile as the primary target
Write-Host "Starting Expo for mobile development..." -ForegroundColor Green
Write-Host "Python server is running in the background at: http://$ipAddress`:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop all processes when done." -ForegroundColor Yellow

try {
    npx expo start --tunnel
}
finally {
    # Cleanup the server job when script exits
    if ($serverJob) {
        Stop-Job -Job $serverJob
        Remove-Job -Job $serverJob
        Write-Host "Server job stopped." -ForegroundColor Cyan
    }
} 