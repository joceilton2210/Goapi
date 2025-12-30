import axios from 'axios';
import logger from '../utils/logger.js';

class ChatwootService {
    constructor() {
        this.baseUrl = process.env.CHATWOOT_URL;
        this.apiAccessToken = process.env.CHATWOOT_TOKEN;
        this.inboxId = process.env.CHATWOOT_INBOX_ID;
    }

    async createContact(name, phoneNumber) {
        try {
            if (!this.baseUrl) return;

            const response = await axios.post(
                `${this.baseUrl}/api/v1/accounts/1/contacts`,
                {
                    name: name || phoneNumber,
                    phone_number: phoneNumber
                },
                {
                    headers: { 'api_access_token': this.apiAccessToken }
                }
            );

            return response.data.payload.contact;
        } catch (error) {
            logger.error(`Error creating Chatwoot contact: ${error.message}`);
            return null;
        }
    }

    async createConversation(contactId, sourceId) {
        try {
            if (!this.baseUrl) return;

            const response = await axios.post(
                `${this.baseUrl}/api/v1/accounts/1/conversations`,
                {
                    source_id: sourceId,
                    inbox_id: this.inboxId,
                    contact_id: contactId
                },
                {
                    headers: { 'api_access_token': this.apiAccessToken }
                }
            );

            return response.data;
        } catch (error) {
            logger.error(`Error creating Chatwoot conversation: ${error.message}`);
            return null;
        }
    }

    async sendMessage(conversationId, content, messageType = 'text') {
        try {
            if (!this.baseUrl) return;

            await axios.post(
                `${this.baseUrl}/api/v1/accounts/1/conversations/${conversationId}/messages`,
                {
                    content,
                    message_type: messageType
                },
                {
                    headers: { 'api_access_token': this.apiAccessToken }
                }
            );
            
            return true;
        } catch (error) {
            logger.error(`Error sending message to Chatwoot: ${error.message}`);
            return false;
        }
    }
}

export default new ChatwootService();
