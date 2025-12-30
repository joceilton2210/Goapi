#!/bin/bash

echo "🚀 Instalação GO API WhatsApp - Linux"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar se está rodando como root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}⚠️  Não execute este script como root!${NC}"
    exit 1
fi

echo -e "${BLUE}Passo 1: Verificando dependências...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não instalado${NC}"
    echo "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
fi

# PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL não instalado${NC}"
    read -p "Deseja instalar PostgreSQL? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        sudo apt-get install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi
else
    echo -e "${GREEN}✅ PostgreSQL instalado${NC}"
fi

echo ""
echo -e "${BLUE}Passo 2: Instalando dependências do projeto...${NC}"
npm install

echo ""
echo -e "${BLUE}Passo 3: Configurando banco de dados...${NC}"
read -p "Deseja criar o banco de dados agora? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    sudo -u postgres psql << EOF
CREATE DATABASE whatsapp;
CREATE USER whatsapp WITH PASSWORD 'whatsapp_password';
GRANT ALL PRIVILEGES ON DATABASE whatsapp TO whatsapp;
\q
EOF
    echo -e "${GREEN}✅ Banco de dados criado${NC}"
fi

echo ""
echo -e "${GREEN}✅ Instalação concluída!${NC}"
echo ""
echo "Para iniciar o servidor:"
echo "  ./start-linux.sh"
echo ""
