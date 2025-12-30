#!/usr/bin/env node

/**
 * 🧪 TESTE RÁPIDO - Verifica se tudo está configurado corretamente
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('\n🧪 TESTE RÁPIDO DE CONFIGURAÇÃO\n');
console.log('='.repeat(50));

// 1. Verificar Node.js
console.log('\n1️⃣  Verificando Node.js...');
console.log(`   ✓ Versão: ${process.version}`);
if (parseInt(process.version.slice(1)) < 18) {
    console.log('   ⚠️  AVISO: Node.js 18+ recomendado');
}

// 2. Verificar dependências
console.log('\n2️⃣  Verificando dependências...');
const dependencies = [
    '@whiskeysockets/baileys',
    'express',
    'socket.io',
    'pg',
    'ioredis',
    'pino'
];

let allInstalled = true;
for (const dep of dependencies) {
    try {
        const pkg = require(`${dep}/package.json`);
        console.log(`   ✓ ${dep}@${pkg.version}`);
    } catch (e) {
        console.log(`   ✗ ${dep} - NÃO INSTALADO`);
        allInstalled = false;
    }
}

if (!allInstalled) {
    console.log('\n❌ Execute: npm install');
    process.exit(1);
}

// 3. Verificar variáveis de ambiente
console.log('\n3️⃣  Verificando variáveis de ambiente...');
const envVars = {
    'PORT': process.env.PORT || '4000',
    'NODE_ENV': process.env.NODE_ENV || 'development',
    'API_KEY': process.env.API_KEY || 'change-this-key',
    'DB_HOST': process.env.DB_HOST || 'localhost',
    'DB_USER': process.env.DB_USER || 'postgres',
    'DB_NAME': process.env.DB_NAME || 'whatsapp',
    'REDIS_HOST': process.env.REDIS_HOST || 'localhost'
};

for (const [key, value] of Object.entries(envVars)) {
    console.log(`   ${key}: ${value}`);
}

// 4. Verificar arquivos críticos
console.log('\n4️⃣  Verificando arquivos críticos...');
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const criticalFiles = [
    'src/server.js',
    'src/services/baileys.service.js',
    'src/services/socket.service.js',
    'src/controllers/instance.controller.js',
    'src/config/database.js'
];

let allFilesExist = true;
for (const file of criticalFiles) {
    const path = join(__dirname, file);
    if (existsSync(path)) {
        console.log(`   ✓ ${file}`);
    } else {
        console.log(`   ✗ ${file} - NÃO ENCONTRADO`);
        allFilesExist = false;
    }
}

if (!allFilesExist) {
    console.log('\n❌ Arquivos críticos faltando!');
    process.exit(1);
}

// 5. Teste de importação
console.log('\n5️⃣  Testando importações...');
try {
    const { default: baileysService } = await import('./src/services/baileys.service.js');
    console.log('   ✓ baileys.service.js');
    
    const { default: socketService } = await import('./src/services/socket.service.js');
    console.log('   ✓ socket.service.js');
    
    console.log('\n✅ TODOS OS TESTES PASSARAM!\n');
    console.log('🚀 Você pode iniciar o servidor:');
    console.log('   npm start\n');
    console.log('📱 Ou testar conexão Baileys isolada:');
    console.log('   node test-connection.js\n');
    
} catch (error) {
    console.log('\n❌ ERRO AO IMPORTAR MÓDULOS:');
    console.error(error.message);
    console.log('\nVerifique os erros acima e corrija antes de continuar.\n');
    process.exit(1);
}

console.log('='.repeat(50));
console.log('\n');
