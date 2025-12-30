FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    bash

WORKDIR /app

# Copiar TUDO do repositório primeiro
COPY . .

# Entrar na pasta da API
WORKDIR /app/api

# Instalar TODAS as dependências (incluindo Socket.IO)
RUN npm install --production && \
    npm install socket.io@^4.7.2 && \
    npm cache clean --force

# Criar diretórios necessários
RUN mkdir -p sessions uploads logs baileys_auth_info

# Dar permissão de execução ao script
RUN chmod +x start.sh

# Expor porta
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização (já estamos em /app/api)
CMD ["./start.sh"]


