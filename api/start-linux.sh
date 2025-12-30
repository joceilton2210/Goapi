#!/bin/bash

echo "🚀 Iniciando GO API WhatsApp (Linux)..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado.${NC}"
    echo "Por favor, instale o Node.js primeiro:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  CentOS/RHEL: sudo yum install nodejs npm"
    echo "  Arch: sudo pacman -S nodejs npm"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não está instalado.${NC}"
    echo "Por favor, instale o npm primeiro."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Aviso: Node.js versão 18+ é recomendado. Versão atual: $(node -v)${NC}"
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao instalar dependências.${NC}"
        exit 1
    fi
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Criando arquivo padrão...${NC}"
    cat > .env << 'EOF'
# Environment
NODE_ENV=production

# Server
PORT=4000
HOST=0.0.0.0

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
    echo -e "${GREEN}✅ Arquivo .env criado.${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Configure suas credenciais no arquivo .env antes de continuar!${NC}"
    echo ""
    read -p "Pressione ENTER para continuar ou CTRL+C para sair e configurar..."
fi

# Verificar se o PostgreSQL está acessível
echo -e "${YELLOW}🔍 Verificando conexão com PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    # Carregar variáveis do .env
    export $(cat .env | grep -v '^#' | xargs)
    
    # Tentar conectar
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PostgreSQL conectado com sucesso!${NC}"
    else
        echo -e "${YELLOW}⚠️  Não foi possível conectar ao PostgreSQL.${NC}"
        echo "Verifique se:"
        echo "  1. PostgreSQL está rodando: sudo systemctl status postgresql"
        echo "  2. Banco de dados existe: psql -U postgres -c 'CREATE DATABASE whatsapp;'"
        echo "  3. Credenciais no .env estão corretas"
        echo ""
        read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  psql não encontrado. Pulando verificação do PostgreSQL.${NC}"
fi

# Verificar se a porta está em uso
PORT=$(grep "^PORT=" .env | cut -d'=' -f2)
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Porta $PORT já está em uso!${NC}"
    echo "Processos usando a porta:"
    lsof -Pi :$PORT -sTCP:LISTEN
    echo ""
    read -p "Deseja matar o processo e continuar? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
        kill -9 $PID
        echo -e "${GREEN}✅ Processo finalizado.${NC}"
    else
        exit 1
    fi
fi

# Iniciar o servidor
echo ""
echo -e "${GREEN}🔥 Iniciando servidor...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm start
