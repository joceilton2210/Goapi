import { Server } from 'socket.io';
import logger from '../utils/logger.js';

class SocketService {
    constructor() {
        this.io = null;
        this.connectedClients = new Map(); // instanceId -> Set of socket IDs
    }

    initialize(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            },
            transports: ['websocket', 'polling']
        });

        this.io.on('connection', (socket) => {
            logger.info(`Socket connected: ${socket.id}`);

            // Cliente se inscreve para receber atualizações de uma instância
            socket.on('subscribe', (instanceId) => {
                logger.info(`Socket ${socket.id} subscribed to instance: ${instanceId}`);
                
                socket.join(`instance:${instanceId}`);
                
                // Rastrear clientes conectados
                if (!this.connectedClients.has(instanceId)) {
                    this.connectedClients.set(instanceId, new Set());
                }
                this.connectedClients.get(instanceId).add(socket.id);
            });

            // Cliente cancela inscrição
            socket.on('unsubscribe', (instanceId) => {
                logger.info(`Socket ${socket.id} unsubscribed from instance: ${instanceId}`);
                socket.leave(`instance:${instanceId}`);
                
                if (this.connectedClients.has(instanceId)) {
                    this.connectedClients.get(instanceId).delete(socket.id);
                }
            });

            socket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${socket.id}`);
                
                // Remover de todas as instâncias
                for (const [instanceId, clients] of this.connectedClients.entries()) {
                    clients.delete(socket.id);
                    if (clients.size === 0) {
                        this.connectedClients.delete(instanceId);
                    }
                }
            });
        });

        logger.info('✓ Socket.IO initialized');
    }

    // Emitir evento para uma instância específica
    emitToInstance(instanceId, event, data) {
        if (!this.io) {
            logger.warn('Socket.IO not initialized');
            return;
        }

        const room = `instance:${instanceId}`;
        this.io.to(room).emit(event, data);
        
        logger.debug(`Emitted ${event} to instance ${instanceId}:`, data);
    }

    // Emitir QR Code atualizado
    emitQRCode(instanceId, qrCode) {
        this.emitToInstance(instanceId, 'qr:updated', { qrCode });
    }

    // Emitir status de conexão
    emitConnectionStatus(instanceId, status, data = {}) {
        this.emitToInstance(instanceId, 'connection:status', {
            status,
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    // Emitir que conectou com sucesso
    emitConnected(instanceId, phoneNumber, userName) {
        this.emitToInstance(instanceId, 'connection:success', {
            phoneNumber,
            userName,
            timestamp: new Date().toISOString()
        });
    }

    // Emitir desconexão
    emitDisconnected(instanceId, reason) {
        this.emitToInstance(instanceId, 'connection:disconnected', {
            reason,
            timestamp: new Date().toISOString()
        });
    }

    // Verificar se há clientes conectados para uma instância
    hasClientsForInstance(instanceId) {
        return this.connectedClients.has(instanceId) && 
               this.connectedClients.get(instanceId).size > 0;
    }

    // Obter número de clientes conectados
    getClientCount(instanceId) {
        return this.connectedClients.get(instanceId)?.size || 0;
    }
}

export default new SocketService();
