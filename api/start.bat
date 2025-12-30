@echo off
echo 🚀 Iniciando GO API WhatsApp...

REM Verificar se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não está instalado. Por favor, instale o Node.js primeiro.
    pause
    exit /b 1
)

REM Verificar se o npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm não está instalado. Por favor, instale o npm primeiro.
    pause
    exit /b 1
)

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    call npm install
)

REM Verificar se o arquivo .env existe
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado. Criando arquivo padrão...
    (
        echo # Environment
        echo NODE_ENV=development
        echo.
        echo # Server
        echo PORT=4000
        echo HOST=localhost
        echo.
        echo # API
        echo API_KEY=change-this-key
        echo.
        echo # Webhooks
        echo WEBHOOK_ENABLED=true
        echo.
        echo # Logs
        echo LOG_LEVEL=info
        echo.
        echo # Database ^(PostgreSQL^)
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=whatsapp
        echo DB_USER=whatsapp
        echo DB_PASSWORD=whatsapp_password
    ) > .env
    echo ✅ Arquivo .env criado. Por favor, configure suas credenciais.
)

REM Iniciar o servidor
echo 🔥 Iniciando servidor...
npm start
