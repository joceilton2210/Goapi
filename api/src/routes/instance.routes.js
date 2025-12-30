import { Router } from 'express';
import instanceController from '../controllers/instance.controller.js';

const router = Router();

// Criar nova instância
router.post('/', instanceController.create);

// Listar todas as instâncias
router.get('/', instanceController.list);

// Obter status de uma instância
router.get('/:instanceId/status', instanceController.getStatus);

// Obter QR Code
router.get('/:instanceId/qr', instanceController.getQR);

// Deletar instância
router.delete('/:instanceId', instanceController.delete);

export default router;
