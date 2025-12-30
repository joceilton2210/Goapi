Guia de Instalação VPS via GitHub
Este método é o mais rápido e profissional para instalar sua API.

1. Preparar o Repositório (No seu PC)
Você precisa enviar seu código para o GitHub primeiro.

Crie um repositório NOVO no GitHub (ex: go-api-whatsapp).
Abra o terminal na pasta do projeto (c:\wamp64\www\go) e rode:
git init
git add .
git commit -m "Primeira versão estável"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/go-api-whatsapp.git
git push -u origin main
2. Instalar na VPS (Servidor)
Acesse sua VPS e siga os passos:

Passo 1: Atualizar e Instalar Docker/Git
sudo apt update && sudo apt upgrade -y
sudo apt install -y git docker.io docker-compose-plugin
Passo 2: Clonar o Repositório
# Vá para a pasta home
cd /home
# Clone seu projeto (Ele vai pedir usuário e senha/token do GitHub)
git clone https://github.com/SEU_USUARIO/go-api-whatsapp.git
# Entre na pasta
cd go-api-whatsapp
Passo 3: Configurar o Ambiente
Como o arquivo .env não vai para o GitHub por segurança, você precisa criá-lo na VPS.

# Entre na pasta da API
cd api
# Crie o arquivo .env
nano .env
Cole o conteúdo abaixo (ajuste se necessario):

PORT=4000
NODE_ENV=production
API_KEY=change-this-key
WEBHOOK_GLOBAL_URL=
(Aperte Ctrl+O e Enter para salvar, e Ctrl+X para sair)

Passo 4: Subir a API
Volte para a pasta raiz (onde está o docker-compose.yml) e suba o sistema.

cd ..
docker compose up -d --build
Pronto! 🚀
Sua API estará rodando.

Painel: http://IP-DA-VPS:4000/instancia.html (Você precisará configurar um Nginx ou acessar via porta se liberada).
API: http://IP-DA-VPS:4000/api
Nota: Para acessar os arquivos HTML (login, instancia, etc), o ideal é usar um servidor web como Nginx na frente, mas com a configuração atual do Docker, eles não estão sendo servidos automaticamente.

Correção Recomendada: Para servir o Frontend (HTMLs) junto com a API, precisamos ajustar o server.js para servir arquivos estáticos da pasta raiz ou criar um container Nginx.
