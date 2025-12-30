#!/bin/bash

echo "🚀 Iniciando GO API WhatsApp..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado. Por favor, instale o npm primeiro."
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Criando arquivo padrão..."
    cat > .env << EOF
# Environment
NODE_ENV=development

# Server
PORT=4000
HOST=localhost

# API
API_KEY=change-this-key

# Webhooks
WEBHOOK_ENABLED=true

# Logs
LOG_LEVEL=info

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp
DB_USER=whatsapp
DB_PASSWORD=whatsapp_password
EOF
    echo "✅ Arquivo .env criado. Por favor, configure suas credenciais."
fi

# Iniciar o servidor
echo "🔥 Iniciando servidor..."
npm start
