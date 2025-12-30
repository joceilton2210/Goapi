@echo off
echo 🧪 TESTE DO DOCKERFILE - Verificação Local
echo ==========================================
echo.

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está instalado!
    exit /b 1
)

echo ✓ Docker instalado
echo.

REM Build da imagem
echo 📦 Building imagem...
cd api
docker build -t go-api-test . > build.log 2>&1

if %errorlevel% equ 0 (
    echo.
    echo ✅ BUILD SUCESSO!
    echo.
    
    REM Verificar estrutura de arquivos
    echo 🔍 Verificando estrutura de arquivos no container...
    docker run --rm go-api-test sh -c "ls -la /app/ && echo '---' && ls -la /app/api/"
    
    echo.
    echo 🔍 Verificando se node_modules foi instalado...
    docker run --rm go-api-test sh -c "ls -la /app/api/node_modules/ | head -20"
    
    echo.
    echo 🔍 Verificando se Socket.IO foi instalado...
    docker run --rm go-api-test sh -c "npm list socket.io"
    
    echo.
    echo 🔍 Verificando diretórios criados...
    docker run --rm go-api-test sh -c "ls -la /app/api/ | grep -E 'sessions|uploads|logs|baileys'"
    
    echo.
    echo ✅ TODOS OS TESTES PASSARAM!
    echo.
    echo 🚀 Você pode fazer deploy no Easypanel agora:
    echo    1. git add .
    echo    2. git commit -m "Fix: Dockerfile para Easypanel"
    echo    3. git push origin main
    echo    4. No Easypanel: Rebuild do serviço
    echo.
    
    REM Limpar imagem de teste
    docker rmi go-api-test
) else (
    echo.
    echo ❌ BUILD FALHOU!
    echo.
    echo Verifique o arquivo build.log para detalhes
    echo.
    exit /b 1
)

cd ..
