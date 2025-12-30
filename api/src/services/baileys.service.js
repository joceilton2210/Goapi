import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
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

    async createInstance(instanceId) {
        try {
            // Verificar se já existe em memória
            if (this.instances.has(instanceId)) {
                const existingInstance = this.instances.get(instanceId);
                const isConnected = existingInstance.isConnected();
                const qrCode = existingInstance.qrCode();
                
                logger.info(`Instance ${instanceId} already exists in memory - Connected: ${isConnected}, Has QR: ${!!qrCode}`);
                
                return {
                    instanceId,
                    status: isConnected ? 'connected' : 'waiting_qr',
                    qrCode,
                    isConnected
                };
            }

            logger.info(`Creating new instance: ${instanceId}`);

            // DB Auth - Carrega credenciais salvas ou cria novas
            const { state, saveCreds } = await usePostgresAuthState(instanceId);
            const { version } = await fetchLatestBaileysVersion();

            // Estado compartilhado da instância
            const instanceState = {
                qrCode: null,
                isConnected: false,
                connectionStatus: 'initializing'
            };

            const sock = makeWASocket({
                version,
                logger: logger.child({ class: 'baileys' }),
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger)
                },
                msgRetryCounterCache,
                generateHighQualityLinkPreview: true,
                printQRInTerminal: false,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 30000
            });

            // Event handlers
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                logger.info(`[${instanceId}] Connection update: ${connection || 'no-change'}`);

                // QR Code gerado
                if (qr) {
                    instanceState.qrCode = qr;
                    instanceState.connectionStatus = 'qr_generated';
                    qrcode.generate(qr, { small: true });
                    logger.info(`[${instanceId}] ✓ QR Code generated`);
                    
                    // Emitir via WebSocket em tempo real
                    socketService.emitQRCode(instanceId, qr);
                    socketService.emitConnectionStatus(instanceId, 'qr_generated');
                    
                    webhookService.trigger(instanceId, 'qr.updated', { qr });
                }

                // Conexão fechada
                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    
                    logger.warn(`[${instanceId}] Connection closed - Status: ${statusCode}, Reconnect: ${shouldReconnect}`);
                    
                    instanceState.isConnected = false;
                    instanceState.connectionStatus = 'disconnected';
                    
                    webhookService.trigger(instanceId, 'instance.disconnected', { 
                        reason: lastDisconnect?.error?.message,
                        statusCode 
                    });
                    
                    if (shouldReconnect) {
                        // NUNCA deletar a instância - apenas reconectar
                        instanceState.connectionStatus = 'reconnecting';
                        logger.info(`[${instanceId}] Scheduling reconnection in 5 seconds...`);
                        
                        setTimeout(async () => {
                            try {
                                logger.info(`[${instanceId}] Attempting reconnection...`);
                                // Não chamar createInstance novamente, apenas reconectar o socket
                                await sock.ws.close();
                            } catch (error) {
                                logger.error(`[${instanceId}] Reconnection error:`, error);
                            }
                        }, 5000);
                    } else {
                        // Logout explícito - APENAS AQUI deletamos
                        logger.warn(`[${instanceId}] Explicit logout detected - removing from memory`);
                        this.instances.delete(instanceId);
                    }
                }

                // Conectando
                if (connection === 'connecting') {
                    instanceState.connectionStatus = 'connecting';
                    logger.info(`[${instanceId}] Connecting to WhatsApp...`);
                    
                    // Emitir via WebSocket
                    socketService.emitConnectionStatus(instanceId, 'connecting');
                }

                // Conectado com sucesso
                if (connection === 'open') {
                    instanceState.isConnected = true;
                    instanceState.qrCode = null;
                    instanceState.connectionStatus = 'connected';
                    
                    const phoneNumber = sock.user?.id || 'unknown';
                    const userName = sock.user?.name || 'Unknown';
                    
                    logger.info(`[${instanceId}] ✓✓✓ CONNECTED SUCCESSFULLY ✓✓✓`);
                    logger.info(`[${instanceId}] Phone: ${phoneNumber}`);
                    logger.info(`[${instanceId}] Name: ${userName}`);
                    
                    // Emitir via WebSocket IMEDIATAMENTE
                    socketService.emitConnected(instanceId, phoneNumber, userName);
                    socketService.emitConnectionStatus(instanceId, 'connected', { phoneNumber, userName });
                    
                    webhookService.trigger(instanceId, 'instance.connected', { 
                        phone: phoneNumber,
                        name: userName,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            // Mensagens recebidas
            sock.ev.on('messages.upsert', async (m) => {
                if (m.type === 'notify') {
                    for (const msg of m.messages) {
                        if (!msg.key.fromMe) {
                            logger.debug(`[${instanceId}] Message received from ${msg.key.remoteJid}`);
                            webhookService.trigger(instanceId, 'message.received', msg);
                        }
                    }
                }
            });

            // Salvar credenciais quando atualizadas
            sock.ev.on('creds.update', async () => {
                logger.debug(`[${instanceId}] Credentials updated, saving to database...`);
                await saveCreds();
            });

            // Armazenar instância em memória
            this.instances.set(instanceId, {
                sock,
                qrCode: () => instanceState.qrCode,
                isConnected: () => instanceState.isConnected,
                getStatus: () => instanceState.connectionStatus,
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
            throw error;
        }
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
        const instance = this.instances.get(instanceId);
        
        if (!instance) {
            logger.warn(`[${instanceId}] Instance not found for deletion`);
            throw new Error('Instance not found');
        }

        try {
            logger.info(`[${instanceId}] User requested deletion - logging out...`);
            
            // Fazer logout do WhatsApp
            await instance.sock.logout();
            
            // Remover da memória
            this.instances.delete(instanceId);
            
            // Limpar credenciais do banco de dados
            await query('DELETE FROM auth_sessions WHERE id = $1', [instanceId]);
            
            logger.info(`[${instanceId}] ✓ Instance deleted successfully`);
            
            return true;
        } catch (error) {
            logger.error(`[${instanceId}] Error deleting instance:`, error);
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
