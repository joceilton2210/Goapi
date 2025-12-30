import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { usePostgresAuthState } from '../auth/PostgresAuthState.js';
import qrcode from 'qrcode-terminal';
import NodeCache from 'node-cache';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import webhookService from './webhook.service.js';

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
            // Se já existe, não criar novamente
            if (this.instances.has(instanceId)) {
                logger.info(`Instance ${instanceId} already exists, skipping creation`);
                return {
                    instanceId,
                    status: 'already_exists',
                    qrCode: this.getQRCode(instanceId)
                };
            }

            // DB Auth
            const { state, saveCreds } = await usePostgresAuthState(instanceId);
            const { version } = await fetchLatestBaileysVersion();

            // Criar objeto de estado compartilhado
            const instanceState = {
                qrCode: null,
                isConnected: false
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
                printQRInTerminal: false
            });

            // Event handlers
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                logger.info(`Connection update for ${instanceId}: ${connection}`);

                if (qr) {
                    instanceState.qrCode = qr;
                    qrcode.generate(qr, { small: true });
                    logger.info(`QR Code generated for instance: ${instanceId}`);
                    webhookService.trigger(instanceId, 'qr.updated', { qr });
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    logger.info(`Connection closed for ${instanceId}, reconnecting: ${shouldReconnect}`);
                    webhookService.trigger(instanceId, 'instance.disconnected', { reason: lastDisconnect?.error });
                    
                    instanceState.isConnected = false;
                    
                    if (shouldReconnect) {
                        // Não deletar a instância, apenas tentar reconectar
                        setTimeout(() => {
                            logger.info(`Attempting to reconnect instance ${instanceId}`);
                            this.createInstance(instanceId);
                        }, 5000);
                    } else {
                        // Só deletar se foi logout explícito
                        this.instances.delete(instanceId);
                        logger.info(`Instance ${instanceId} logged out, removed from memory`);
                    }
                }

                if (connection === 'open') {
                    logger.info(`✓ Instance ${instanceId} connected successfully! Phone: ${sock.user?.id}`);
                    instanceState.isConnected = true;
                    instanceState.qrCode = null;
                    webhookService.trigger(instanceId, 'instance.connected', { 
                        phone: sock.user?.id,
                        name: sock.user?.name 
                    });
                }

                if (connection === 'connecting') {
                    logger.info(`Instance ${instanceId} is connecting...`);
                }
            });

            sock.ev.on('messages.upsert', async (m) => {
                if (m.type === 'notify') {
                    for (const msg of m.messages) {
                        if (!msg.key.fromMe) {
                            webhookService.trigger(instanceId, 'message.received', msg);
                        }
                    }
                }
            });

            sock.ev.on('creds.update', saveCreds);

            // Armazenar instância
            this.instances.set(instanceId, {
                sock,
                qrCode: () => instanceState.qrCode,
                isConnected: () => instanceState.isConnected,
                createdAt: new Date()
            });

            logger.info(`Instance ${instanceId} created`);

            return {
                instanceId,
                status: 'created',
                qrCode: instanceState.qrCode
            };

        } catch (error) {
            logger.error(`Error creating instance ${instanceId}:`, error);
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
            throw new Error('Instance not found');
        }

        try {
            await instance.sock.logout();
            this.instances.delete(instanceId);
            logger.info(`Instance ${instanceId} deleted`);
            return true;
        } catch (error) {
            logger.error(`Error deleting instance ${instanceId}:`, error);
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
                createdAt: null
            };
        }

        return {
            instanceId,
            isConnected: instance.isConnected(),
            hasQR: !!instance.qrCode(),
            exists: true,
            createdAt: instance.createdAt
        };
    }
}

export default new BaileysService();
