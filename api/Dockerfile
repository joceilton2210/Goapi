FROM node:20-alpine

# Instalar dependências do sistema necessárias para o Baileys/Puppeteer (se necessário)
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++
# Copiar código fonte da API
COPY . .

# Copiar Frontend (Assumindo que o Docker build context é a raiz do projeto 'go', não apenas 'api')
# Se o build context for 'api', precisaremos mover os arquivos antes.
# Assumindo estrutura EasyPanel/GitHub onde a raiz é 'go':
# COPY ../*.html ./public/
# COPY ../assets ./public/assets

# Mas como o Dockerfile está em 'api/', e o EasyPanel pode usar a raiz como context:
# Vamos garantir que a pasta public exista e copiar os arquivos se estiverem disponíveis no contexto.
# O mais seguro para EasyPanel (Git) é definir a raiz como contexto.
# Ajuste: Vamos assumir que os arquivos HTML estão na raiz do repo e Dockerfile em api/Dockerfile.
# O EasyPanel permite definir 'Build Context' e 'Dockerfile Path'.
# Se Context = Root (.), então COPY api/ . funciona para API, e COPY *.html api/public/ funciona para HTML.
# VAMOS REESCREVER PARA CONTEXTO RAIZ (.)

WORKDIR /app

# Copiar package.json da API
COPY api/package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar Código da API
COPY api/ .

# Criar pasta public e Copiar Frontend da Raiz
RUN mkdir -p public
COPY *.html public/
COPY *.png public/
COPY assets public/assets/

# Criar diretórios necessários
RUN mkdir -p sessions uploads logs

# Expor porta
EXPOSE 4000

# Comando de inicialização
CMD ["npm", "start"]
