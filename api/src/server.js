import express from 'express';
import cors from 'cors';
import config from './config/default.js';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';

// Rotas
import instanceRoutes from './routes/instance.routes.js';
import messageRoutes from './routes/message.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

// ... (existing code)

// Rotas protegidas
app.use('/api/instances', authMiddleware, instanceRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/webhooks', authMiddleware, webhookRoutes);

// Error handler
app.use(errorHandler);

// Iniciar servidor
app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Tratamento de exceções não capturadas
process.on('uncaughtException', (err) => {
    logger.fatal(err, 'Uncaught Exception');
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.fatal(err, 'Unhandled Rejection');
    process.exit(1);
});
