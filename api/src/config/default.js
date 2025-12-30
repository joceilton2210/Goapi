import dotenv from 'dotenv';
dotenv.config();

export default {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    apiKey: process.env.API_KEY || 'change-this-key',
    logLevel: process.env.LOG_LEVEL || 'info',
    webhook: {
        enabled: process.env.WEBHOOK_ENABLED === 'true'
    }
};
