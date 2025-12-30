import axios from 'axios';
import logger from '../utils/logger.js';

class TypebotService {
    async processMessage(instanceId, message, typebotUrl, typebotSessionId) {
        try {
            if (!typebotUrl) return;

            const content = message.message?.conversation || 
                          message.message?.extendedTextMessage?.text || '';

            if (!content) return;

            logger.info(`Sending message to Typebot: ${typebotUrl}`);

            const response = await axios.post(typebotUrl, {
                message: content,
                sessionId: typebotSessionId || message.key.remoteJid
            });

            // Retornar resposta do Typebot para ser enviada de volta ao usuário
            return response.data;
        } catch (error) {
            logger.error(`Error processing Typebot message: ${error.message}`);
            return null;
        }
    }
}

export default new TypebotService();
