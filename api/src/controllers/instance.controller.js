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
            const status = baileysService.getStatus(instanceId);

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            next(error);
        }
    }

    async getQR(req, res, next) {
        try {
            const { instanceId } = req.params;
            const qrCode = baileysService.getQRCode(instanceId);

            if (!qrCode) {
                return res.status(404).json({
                    success: false,
                    message: 'QR Code not available. Instance may be already connected.'
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
            await baileysService.deleteInstance(instanceId);

            res.json({
                success: true,
                message: 'Instance deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new InstanceController();
