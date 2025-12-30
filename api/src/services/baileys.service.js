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
            if (this.instances.has(instanceId)) {
                throw new Error('Instance already exists');
            }

            // DB Auth
            const { state, saveCreds } = await usePostgresAuthState(instanceId);
            const { version } = await fetchLatestBaileysVersion();

            let qrCode = null;
            let isConnected = false;

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

                if (qr) {
                    qrCode = qr;
                    qrcode.generate(qr, { small: true });
                    logger.info(`QR Code generated for instance: ${instanceId}`);
                    webhookService.trigger(instanceId, 'qr.updated', { qr });
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    logger.info(`Connection closed for ${instanceId}, reconnecting: ${shouldReconnect}`);
                    webhookService.trigger(instanceId, 'instance.disconnected', { reason: lastDisconnect?.error });
                    
                    if (shouldReconnect) {
                        setTimeout(() => this.createInstance(instanceId), 3000);
                    } else {
                        this.instances.delete(instanceId);
                    }
                    
                    isConnected = false;
                }

                if (connection === 'open') {
                    logger.info(`Instance ${instanceId} connected successfully`);
                    isConnected = true;
                    qrCode = null;
                    webhookService.trigger(instanceId, 'instance.connected', { phone: sock.user.id });
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
                qrCode: () => qrCode,
                isConnected: () => isConnected,
                createdAt: new Date()
            });

            logger.info(`Instance ${instanceId} created`);

            return {
                instanceId,
                status: 'created',
                qrCode
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
            throw new Error('Instance not found');
        }

        return instance.qrCode();
    }

    getStatus(instanceId) {
        const instance = this.instances.get(instanceId);
        
        if (!instance) {
            throw new Error('Instance not found');
        }

        return {
            instanceId,
            isConnected: instance.isConnected(),
            hasQR: !!instance.qrCode(),
            createdAt: instance.createdAt
        };
    }
}

export default new BaileysService();
