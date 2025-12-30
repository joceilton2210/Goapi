import { Router } from 'express';
import messageController from '../controllers/message.controller.js';

const router = Router();

// Enviar texto
router.post('/:instanceId/send-text', messageController.sendText);

// Enviar imagem
router.post('/:instanceId/send-image', messageController.sendImage);

// Enviar áudio
router.post('/:instanceId/send-audio', messageController.sendAudio);

// Enviar vídeo
router.post('/:instanceId/send-video', messageController.sendVideo);

// Enviar localização
router.post('/:instanceId/send-location', messageController.sendLocation);

// Enviar botão PIX
router.post('/:instanceId/send-pix', messageController.sendPix);

export default router;
