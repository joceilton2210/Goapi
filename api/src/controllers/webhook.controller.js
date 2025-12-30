import webhookService from '../services/webhook.service.js';

class WebhookController {
    async set(req, res, next) {
        try {
            const { instanceId } = req.params;
            const { url, events } = req.body;

            if (!url) {
                return res.status(400).json({
                    success: false,
                    message: 'url is required'
                });
            }

            webhookService.setWebhook(instanceId, url, events);

            res.json({
                success: true,
                message: 'Webhook configured successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async get(req, res, next) {
        try {
            const { instanceId } = req.params;
            const webhook = webhookService.getWebhook(instanceId);

            res.json({
                success: true,
                data: webhook || null
            });
        } catch (error) {
            next(error);
        }
    }

    async remove(req, res, next) {
        try {
            const { instanceId } = req.params;
            webhookService.removeWebhook(instanceId);

            res.json({
                success: true,
                message: 'Webhook removed successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new WebhookController();
