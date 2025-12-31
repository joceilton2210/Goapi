import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} from '@whiskeysockets/baileys';
import { usePostgresAuthState } from '../auth/PostgresAuthState.js';
import { query } from '../config/database.js';
import qrcode from 'qrcode-terminal';
import NodeCache from 'node-cache';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import webhookService from './webhook.service.js';
import socketService from './socket.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache para armazenar instâncias ativas
const instances = new Map();
const msgRetryCounterCache = new NodeCache();

class BaileysService {
    constructor() {
        this.instances = instances;
    }

    async createInstance(instanceId, forceNew = false) {
        try {
            logger.info(`[${instanceId}] 🚀 Starting instance creation... (forceNew: ${forceNew})`);
            
            // Verificar se já existe em memória
            if (this.instances.has(instanceId) && !forceNew) {
                const existingInstance = this.instances.get(instanceId);
                const isConnected = existingInstance.isConnected();
                const qrCode = existingInstance.qrCode();
                
                logger.info(`[${instanceId}] ⚠️ Instance already exists - Connected: ${isConnected}, Has QR: ${!!qrCode}`);
                
                // Se não tem QR e não está conectado, forçar reconexão
                if (!isConnected && !qrCode) {
                    logger.info(`[${instanceId}] 🔄 No QR and not connected, forcing reconnection...`);
                    return await this.reconnectInstance(instanceId);
                }
                
                return {
                    instanceId,
                    status: isConnected ? 'connected' : 'waiting_qr',
                    qrCode,
                    isConnected
                };
            }

            // Se forceNew, limpar instância existente
            if (forceNew && this.instances.has(instanceId)) {
                logger.info(`[${instanceId}] 🧹 Cleaning existing instance for force new...`);
                const oldInstance = this.instances.get(instanceId);
                try {
                    if (oldInstance.sock && oldInstance.sock.ws) {
                        oldInstance.sock.ws.close();
                    }
                } catch (e) {
                    logger.warn(`[${instanceId}] ⚠️ Error closing old socket:`, e.message);
                }
                this.instances.delete(instanceId);
            }

            logger.info(`[${instanceId}] 📦 Loading auth state from database...`);

            // DB Auth - Carrega credenciais salvas ou cria novas
            const { state, saveCreds } = await usePostgresAuthState(instanceId);
            const { version } = await fetchLatestBaileysVersion();
            
            logger.info(`[${instanceId}] ✅ Baileys version: ${version.join('.')}`);

            // Estado compartilhado da instância
            const instanceState = {
                qrCode: null,
                isConnected: false,
                connectionStatus: 'initializing',
                qrCount: 0,
                lastQRTime: null
            };

            logger.info(`[${instanceId}] 🔌 Creating WhatsApp socket...`);

            const sock = makeWASocket({
                version,
                logger: logger.child({ class: 'baileys', level: 'silent' }),
                printQRInTerminal: true,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger)
                },
                browser: Browsers.ubuntu('Chrome'),
                syncFullHistory: false,
                markOnlineOnConnect: false,
                generateHighQualityLinkPreview: false,
                getMessage: async () => undefined,
                // Configurações importantes para estabilidade
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: undefined,
                keepAliveIntervalMs: 30000,
                retryRequestDelayMs: 250,
                qrTimeout: 40000, // Timeout do QR em ms
            });

            logger.info(`[${instanceId}] ✅ WhatsApp socket created successfully`);
            logger.info(`[${instanceId}] 🎧 Setting up event listeners...`);

            // Event handlers
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                logger.info(`[${instanceId}] 📡 Connection update: ${connection || 'qr'}`);

                // QR Code gerado
                if (qr) {
                    instanceState.qrCode = qr;
                    instanceState.connectionStatus = 'qr_generated';
                    instanceState.qrCount++;
                    instanceState.lastQRTime = Date.now();
                    
                    qrcode.generate(qr, { small: true });
                    logger.info(`[${instanceId}] ✅ QR Code generated (count: ${instanceState.qrCount})`);
                    
                    socketService.emitQRCode(instanceId, qr);
                    socketService.emitConnectionStatus(instanceId, 'qr_generated', {
                        qrCount: instanceState.qrCount
                    });
                    webhookService.trigger(instanceId, 'qr.updated', { qr, qrCount: instanceState.qrCount });
                }

                // CONECTADO!
                if (connection === 'open') {
                    instanceState.isConnected = true;
                    instanceState.qrCode = null;
                    instanceState.connectionStatus = 'connected';
                    instanceState.qrCount = 0;
                    
                    const phoneNumber = sock.user?.id?.split(':')[0] || sock.user?.id || 'unknown';
                    const userName = sock.user?.name || sock.user?.verifiedName || 'Unknown';
                    
                    logger.info(`[${instanceId}] ✅✅✅ CONNECTED! ✅✅✅`);
                    logger.info(`[${instanceId}] 📱 Phone: ${phoneNumber}`);
                    logger.info(`[${instanceId}] 👤 Name: ${userName}`);
                    
                    socketService.emitConnected(instanceId, phoneNumber, userName);
                    socketService.emitConnectionStatus(instanceId, 'connected', { phoneNumber, userName });
                    webhookService.trigger(instanceId, 'instance.connected', { 
                        phone: phoneNumber,
                        name: userName,
                        timestamp: new Date().toISOString()
                    });
                }

                // Desconectado
                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const errorMessage = lastDisconnect?.error?.message || 'Unknown error';
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    
                    logger.warn(`[${instanceId}] ❌ Disconnected - Code: ${statusCode}, Message: ${errorMessage}`);
                    
                    instanceState.isConnected = false;
                    instanceState.qrCode = null;
                    instanceState.connectionStatus = 'disconnected';
                    
                    socketService.emitDisconnected(instanceId, errorMessage);
                    socketService.emitConnectionStatus(instanceId, 'disconnected', {
                        statusCode,
                        reason: errorMessage
                    });
                    
                    if (shouldReconnect) {
                        logger.info(`[${instanceId}] 🔄 Will reconnect in 5s...`);
                        
                        // Remover instância atual
                        this.instances.delete(instanceId);
                        
                        // Reconectar após delay
                        setTimeout(async () => {
                            logger.info(`[${instanceId}] 🔄 Reconnecting...`);
                            try {
                                await this.createInstance(instanceId);
                            } catch (err) {
                                logger.error(`[${instanceId}] ❌ Reconnection failed:`, err);
                                socketService.emitConnectionStatus(instanceId, 'error', {
                                    message: 'Falha na reconexão. Tente novamente.'
                                });
                            }
                        }, 5000);
                    } else {
                        logger.warn(`[${instanceId}] 🚪 Logged out - removing`);
                        this.instances.delete(instanceId);
                        
                        // Limpar credenciais do banco
                        try {
                            await query('DELETE FROM auth_sessions WHERE id = $1', [instanceId]);
                            logger.info(`[${instanceId}] 🗑️ Credentials cleared from database`);
                        } catch (err) {
                            logger.error(`[${instanceId}] ❌ Error clearing credentials:`, err);
                        }
                    }
                }
            });

            // Salvar credenciais
            sock.ev.on('creds.update', saveCreds);

            // Mensagens recebidas
            sock.ev.on('messages.upsert', async (m) => {
                if (m.type === 'notify') {
                    for (const msg of m.messages) {
                        if (!msg.key.fromMe) {
                            webhookService.trigger(instanceId, 'message.received', msg);
                        }
                    }
                }
            });

            // Armazenar instância em memória
            this.instances.set(instanceId, {
                sock,
                qrCode: () => instanceState.qrCode,
                isConnected: () => instanceState.isConnected,
                getStatus: () => instanceState.connectionStatus,
                getQRCount: () => instanceState.qrCount,
                createdAt: new Date()
            });

            logger.info(`[${instanceId}] Instance created and stored in memory`);

            return {
                instanceId,
                status: 'created',
                qrCode: instanceState.qrCode,
                isConnected: instanceState.isConnected
            };

        } catch (error) {
            logger.error(`[${instanceId}] Error creating instance:`, error);
            
            // Emitir erro via socket
            socketService.emitConnectionStatus(instanceId, 'error', {
                message: error.message || 'Erro ao criar instância'
            });
            
            throw error;
        }
    }

    // Reconectar instância existente
    async reconnectInstance(instanceId) {
        logger.info(`[${instanceId}] 🔄 Reconnecting instance...`);
        
        // Limpar instância existente
        if (this.instances.has(instanceId)) {
            const oldInstance = this.instances.get(instanceId);
            try {
                if (oldInstance.sock && oldInstance.sock.ws) {
                    oldInstance.sock.ws.close();
                }
            } catch (e) {
                logger.warn(`[${instanceId}] ⚠️ Error closing socket:`, e.message);
            }
            this.instances.delete(instanceId);
        }
        
        // Criar nova instância
        return await this.createInstance(instanceId, true);
    }

    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }

    getAllInstances() {
        const instancesList = [];
        
        for (const [id, instance] of this.instances.entries()) {
            instancesList.push({
                instanceId: id,
                isConnected: instance.isConnected(),
                createdAt: instance.createdAt
            });
        }
        
        return instancesList;
    }

    async deleteInstance(instanceId) {
        logger.info(`[${instanceId}] 🗑️ Starting deletion process...`);
        
        const instance = this.instances.get(instanceId);
        
        if (!instance) {
            logger.warn(`[${instanceId}] ⚠️ Instance not found in memory`);
            throw new Error('Instance not found');
        }

        try {
            // NÃO fazer logout - demora muito e trava
            // Apenas fechar o socket
            logger.info(`[${instanceId}] 🔌 Closing socket...`);
            
            try {
                if (instance.sock && instance.sock.ws) {
                    instance.sock.ws.close();
                    logger.info(`[${instanceId}] ✅ Socket closed`);
                }
            } catch (closeError) {
                logger.warn(`[${instanceId}] ⚠️ Socket close error (continuing):`, closeError.message);
            }
            
            // Remover da memória IMEDIATAMENTE
            logger.info(`[${instanceId}] 🧹 Removing from memory...`);
            this.instances.delete(instanceId);
            logger.info(`[${instanceId}] ✅ Removed from memory`);
            
            // Limpar credenciais do banco de dados
            logger.info(`[${instanceId}] 🗄️ Deleting from database...`);
            const result = await query('DELETE FROM auth_sessions WHERE id = $1', [instanceId]);
            logger.info(`[${instanceId}] ✅ Database deleted (rows: ${result.rowCount})`);
            
            logger.info(`[${instanceId}] ✅✅✅ Instance deleted successfully!`);
            
            return true;
        } catch (error) {
            logger.error(`[${instanceId}] ❌ Error deleting instance:`, error);
            throw error;
        }
    }

    getQRCode(instanceId) {
        const instance = this.instances.get(instanceId);
        
        if (!instance) {
            return null;
        }

        return instance.qrCode();
    }

    getStatus(instanceId) {
        const instance = this.instances.get(instanceId);
        
        if (!instance) {
            return {
                instanceId,
                isConnected: false,
                hasQR: false,
                exists: false,
                connectionStatus: 'not_found',
                createdAt: null
            };
        }

        const isConnected = instance.isConnected();
        const hasQR = !!instance.qrCode();
        const connectionStatus = instance.getStatus ? instance.getStatus() : 'unknown';

        return {
            instanceId,
            isConnected,
            hasQR,
            exists: true,
            connectionStatus,
            createdAt: instance.createdAt
        };
    }
}

export default new BaileysService();
