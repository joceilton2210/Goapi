import axios from 'axios';
import logger from '../utils/logger.js';

class N8NService {
    async triggerWorkflow(webhookUrl, data) {
        try {
            if (!webhookUrl) return;

            logger.info(`Triggering n8n workflow: ${webhookUrl}`);

            await axios.post(webhookUrl, data);
            
            return true;
        } catch (error) {
            logger.error(`Error triggering n8n workflow: ${error.message}`);
            return false;
        }
    }
}

export default new N8NService();
