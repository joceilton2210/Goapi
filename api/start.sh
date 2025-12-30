#!/bin/sh

echo "🚀 Starting GO API WhatsApp..."

# Verificar se Socket.IO está instalado
if ! npm list socket.io > /dev/null 2>&1; then
    echo "📦 Installing Socket.IO..."
    npm install socket.io@^4.7.2
fi

# Verificar se todas as dependências estão instaladas
echo "📦 Checking dependencies..."
npm install --production

# Criar diretórios necessários
mkdir -p sessions uploads logs

# Iniciar aplicação
echo "✓ Starting application..."
exec node src/server.js
