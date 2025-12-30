import messageService from '../services/message.service.js';
import logger from '../utils/logger.js';

class MessageController {
    async sendText(req, res, next) {
        try {
            const { instanceId } = req.params;
            const { number, message } = req.body;

            if (!number || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'number and message are required'
                });
            }

            const result = await messageService.sendText(instanceId, number, message);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async sendImage(req, res, next) {
        try {
            const { instanceId } = req.params;
            const { number, image, caption } = req.body;

            if (!number || !image) {
                return res.status(400).json({
                    success: false,
                    message: 'number and image are required'
                });
            }

            const result = await messageService.sendImage(instanceId, number, image, caption);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async sendAudio(req, res, next) {
        try {
            const { instanceId } = req.params;
            const { number, audio } = req.body;

            if (!number || !audio) {
                return res.status(400).json({
                    success: false,
                    message: 'number and audio are required'
                });
            }

            const result = await messageService.sendAudio(instanceId, number, audio);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async sendVideo(req, res, next) {
        try {
            const { instanceId } = req.params;
            const { number, video, caption } = req.body;

            if (!number || !video) {
                return res.status(400).json({
                    success: false,
                    message: 'number and video are required'
                });
            }

            const result = await messageService.sendVideo(instanceId, number, video, caption);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async sendLocation(req, res, next) {
        try {
            const { instanceId } = req.params;
            const { number, latitude, longitude, name } = req.body;

            if (!number || !latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    message: 'number, latitude and longitude are required'
                });
            }

            const result = await messageService.sendLocation(instanceId, number, latitude, longitude, name);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async sendPix(req, res, next) {
        try {
            const { instanceId } = req.params;
            const { number, pixKey, amount, message } = req.body;

            if (!number || !pixKey || !amount) {
                return res.status(400).json({
                    success: false,
                    message: 'number, pixKey and amount are required'
                });
            }

            const result = await messageService.sendPix(instanceId, number, pixKey, amount, message || 'Pagamento via PIX');

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new MessageController();
