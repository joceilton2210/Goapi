import express from 'express';
import cors from 'cors';
import config from './config/default.js';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { initDb } from './config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rotas
import instanceRoutes from './routes/instance.routes.js';
import messageRoutes from './routes/message.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (HTML, CSS, JS, imagens) da pasta raiz do projeto
app.use(express.static(path.join(__dirname, '../../')));

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Rotas protegidas da API
app.use('/api/instances', authMiddleware, instanceRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/webhooks', authMiddleware, webhookRoutes);

// Rota padrão para servir o login.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../login.html'));
});

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
    logger.info(`Access the web interface at: http://${config.host}:${config.port}/login.html`);
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
