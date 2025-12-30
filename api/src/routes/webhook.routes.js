import { Router } from 'express';
import webhookController from '../controllers/webhook.controller.js';

const router = Router();

// Configurar webhook
router.post('/:instanceId', webhookController.set);

// Obter configuração do webhook
router.get('/:instanceId', webhookController.get);

// Remover webhook
router.delete('/:instanceId', webhookController.remove);

export default router;
