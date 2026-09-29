# Nova Tech Cotizador - Installation Script
# Run this in PowerShell: .\install.ps1

Write-Host "🔍 Verificando Node.js..." -ForegroundColor Cyan
node --version

Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan
npm install --legacy-peer-deps

Write-Host "✅ Instalación completada" -ForegroundColor Green
Write-Host ""
Write-Host "Para ejecutar la app:" -ForegroundColor Yellow
Write-Host "  npm run dev       (modo desarrollo)" -ForegroundColor White
Write-Host "  npm start         (modo producción)" -ForegroundColor White
Write-Host "  npm run db:init   (inicializar BD)" -ForegroundColor White
Write-Host ""
Write-Host "O simplemente ejecutar: start.bat" -ForegroundColor Yellow
