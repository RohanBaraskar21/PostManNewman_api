# Postman Automation Framework Setup Script
# Run this script in PowerShell to set up the framework

param(
    [switch]$SkipNodeCheck,
    [switch]$Force
)

Write-Host "🚀 Setting up Postman Automation Framework..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not $SkipNodeCheck) {
    Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Yellow
    try {
        $nodeVersion = node --version
        $npmVersion = npm --version
        Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
        Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
        
        # Check if Node version is >= 16
        $nodeVersionNumber = [version]($nodeVersion -replace 'v', '')
        if ($nodeVersionNumber -lt [version]"16.0.0") {
            Write-Host "❌ Node.js version 16.0.0 or higher is required" -ForegroundColor Red
            Write-Host "Please update Node.js: https://nodejs.org/" -ForegroundColor Yellow
            exit 1
        }
    }
    catch {
        Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
        Write-Host "Please install Node.js: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
}

# Install npm dependencies
Write-Host ""
Write-Host "📦 Installing npm dependencies..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
}

# Install Newman globally
Write-Host ""
Write-Host "🔧 Installing Newman globally..." -ForegroundColor Yellow
try {
    npm install -g newman
    if ($LASTEXITCODE -ne 0) {
        throw "Newman installation failed"
    }
    Write-Host "✅ Newman installed successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to install Newman: $_" -ForegroundColor Red
    Write-Host "💡 You can also use npx newman instead of global installation" -ForegroundColor Yellow
}

# Install Newman HTML reporter
Write-Host ""
Write-Host "📊 Installing Newman HTML reporter..." -ForegroundColor Yellow
try {
    npm install -g newman-reporter-htmlextra
    if ($LASTEXITCODE -ne 0) {
        throw "Newman HTML reporter installation failed"
    }
    Write-Host "✅ Newman HTML reporter installed successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to install Newman HTML reporter: $_" -ForegroundColor Red
    Write-Host "💡 You can still use basic HTML reporter" -ForegroundColor Yellow
}

# Create reports directory
Write-Host ""
Write-Host "📁 Creating reports directory..." -ForegroundColor Yellow
if (-not (Test-Path "reports")) {
    New-Item -ItemType Directory -Path "reports" -Force | Out-Null
    Write-Host "✅ Reports directory created" -ForegroundColor Green
} else {
    Write-Host "✅ Reports directory already exists" -ForegroundColor Green
}

# Validate collections and environments
Write-Host ""
Write-Host "🔍 Validating collections and environments..." -ForegroundColor Yellow
try {
    npm run validate:collections
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Collection validation warnings (see above)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Collections are valid" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Collection validation failed: $_" -ForegroundColor Red
}

try {
    npm run validate:environments
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Environment validation warnings (see above)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Environments are valid" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Environment validation failed: $_" -ForegroundColor Red
}

# Test Newman installation
Write-Host ""
Write-Host "🧪 Testing Newman installation..." -ForegroundColor Yellow
try {
    $newmanVersion = newman --version
    Write-Host "✅ Newman version: $newmanVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Newman test failed: $_" -ForegroundColor Red
    Write-Host "💡 Try restarting your PowerShell session" -ForegroundColor Yellow
}

# Display next steps
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update environment variables in environments/*.json files" -ForegroundColor White
Write-Host "2. Customize collections in collections/*.json files" -ForegroundColor White
Write-Host "3. Run your first test: npm run test:dev" -ForegroundColor White
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Yellow
Write-Host "  npm run test:dev      - Run tests on development environment" -ForegroundColor White
Write-Host "  npm run test:qa       - Run tests on QA environment" -ForegroundColor White
Write-Host "  npm run test:staging  - Run tests on staging environment" -ForegroundColor White
Write-Host "  npm run test:all      - Run tests on all environments" -ForegroundColor White
Write-Host "  npm run clean         - Clean up old reports" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  docs/setup.md           - Detailed setup guide" -ForegroundColor White
Write-Host "  docs/troubleshooting.md - Troubleshooting guide" -ForegroundColor White
Write-Host ""
Write-Host "For help: https://github.com/your-repo/issues" -ForegroundColor Blue
Write-Host ""

# Display warning about environment variables
Write-Host "⚠️  IMPORTANT: Update the environment variables in the environments/ directory" -ForegroundColor Yellow
Write-Host "   before running tests. The current values are placeholders." -ForegroundColor Yellow
Write-Host ""

Write-Host "Happy testing! 🧪✨" -ForegroundColor Green
