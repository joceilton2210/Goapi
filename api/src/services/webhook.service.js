import axios from 'axios';
import logger from '../utils/logger.js';

class WebhookService {
    constructor() {
        this.webhooks = new Map(); // instanceId -> webhookUrl
    }

    setWebhook(instanceId, url, events) {
        this.webhooks.set(instanceId, { url, events });
        logger.info(`Webhook configured for instance ${instanceId}: ${url}`);
    }

    getWebhook(instanceId) {
        return this.webhooks.get(instanceId);
    }

    removeWebhook(instanceId) {
        this.webhooks.delete(instanceId);
        logger.info(`Webhook removed for instance ${instanceId}`);
    }

    async trigger(instanceId, event, data) {
        const webhook = this.webhooks.get(instanceId);
        
        if (!webhook || !webhook.url) return;

        // Se houver filtro de eventos e o evento atual não estiver na lista, ignora
        if (webhook.events && webhook.events.length > 0 && !webhook.events.includes(event)) {
            return;
        }

        try {
            logger.info(`Triggering webhook ${event} for ${instanceId}`);
            
            await axios.post(webhook.url, {
                event,
                instanceId,
                data,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error(`Error triggering webhook for ${instanceId}: ${error.message}`);
        }
    }
}

export default new WebhookService();
