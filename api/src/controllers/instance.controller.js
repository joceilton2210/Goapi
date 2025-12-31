import baileysService from '../services/baileys.service.js';
import logger from '../utils/logger.js';

class InstanceController {
    async create(req, res, next) {
        try {
            const { instanceId } = req.body;

            if (!instanceId) {
                return res.status(400).json({
                    success: false,
                    message: 'instanceId is required'
                });
            }

            const result = await baileysService.createInstance(instanceId);

            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async list(req, res, next) {
        try {
            const instances = baileysService.getAllInstances();

            res.json({
                success: true,
                data: instances
            });
        } catch (error) {
            next(error);
        }
    }

    async getStatus(req, res, next) {
        try {
            const { instanceId } = req.params;
            
            // Verificar se a instância existe
            const instance = baileysService.getInstance(instanceId);
            
            if (!instance) {
                return res.json({
                    success: true,
                    data: {
                        instanceId,
                        isConnected: false,
                        hasQR: false,
                        exists: false
                    }
                });
            }
            
            const status = baileysService.getStatus(instanceId);

            res.json({
                success: true,
                data: {
                    ...status,
                    exists: true
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getQR(req, res, next) {
        try {
            const { instanceId } = req.params;
            
            // Verificar se a instância existe
            const instance = baileysService.getInstance(instanceId);
            
            // Se não existir, criar automaticamente
            if (!instance) {
                logger.info(`Instance ${instanceId} not found, creating...`);
                await baileysService.createInstance(instanceId);
                
                // Aguardar um pouco para o QR ser gerado
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            const qrCode = baileysService.getQRCode(instanceId);

            if (!qrCode) {
                return res.status(404).json({
                    success: false,
                    message: 'QR Code not available. Instance may be already connected or still initializing.'
                });
            }

            res.json({
                success: true,
                data: {
                    qrCode
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { instanceId } = req.params;
            
            logger.info(`🗑️ Delete request for instance: ${instanceId}`);
            
            const instance = baileysService.getInstance(instanceId);
            
            if (!instance) {
                logger.warn(`Instance ${instanceId} not found in memory`);
                return res.status(404).json({
                    success: false,
                    message: 'Instance not found'
                });
            }
            
            await baileysService.deleteInstance(instanceId);
            
            logger.info(`✅ Instance ${instanceId} deleted successfully`);

            res.json({
                success: true,
                message: 'Instance deleted successfully'
            });
        } catch (error) {
            logger.error(`❌ Error deleting instance:`, error);
            next(error);
        }
    }
}

export default new InstanceController();
