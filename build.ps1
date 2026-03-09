# build.ps1
Write-Host "=== INICIANDO BUILD DO FRONTEND ===" -ForegroundColor Green

# Vai para pasta frontend
cd frontend

# Instala dependências
Write-Host "Instalando dependências..." -ForegroundColor Yellow
npm install

# Corrige vulnerabilidades
Write-Host "Corrigindo vulnerabilidades..." -ForegroundColor Yellow
npm audit fix

# Define variável de ambiente e faz build
Write-Host "Fazendo build sem source maps..." -ForegroundColor Yellow
$env:GENERATE_SOURCEMAP="false"
npm run build

Write-Host "✅ BUILD CONCLUÍDO COM SUCESSO!" -ForegroundColor Green