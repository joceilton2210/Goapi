import express from 'express';
import cors from 'cors';
import config from './config/default.js';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { initDb } from './config/database.js'; // Import DB Init

// Rotas
import instanceRoutes from './routes/instance.routes.js';
import messageRoutes from './routes/message.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

// Middleware de erro
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // Servir arquivos da pasta 'public' (que será criada no Docker)

// Rotas da API
// ...

// Rotas protegidas
app.use('/api/instances', authMiddleware, instanceRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/webhooks', authMiddleware, webhookRoutes);

// Error handler
app.use(errorHandler);

// Iniciar servidor
app.listen(config.port, async () => {
    try {
        await initDb();
        logger.info('Database connected and initialized');
    } catch (e) {
        logger.error('Failed to init DB', e);
    }
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
