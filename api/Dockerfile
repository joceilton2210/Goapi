FROM node:20-alpine

# Instalar dependências do sistema necessárias para o Baileys/Puppeteer (se necessário)
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p sessions uploads logs

# Expor porta
EXPOSE 4000

# Comando de inicialização
CMD ["npm", "start"]
