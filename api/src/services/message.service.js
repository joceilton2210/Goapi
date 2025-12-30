import baileysService from './baileys.service.js';
import logger from '../utils/logger.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MessageService {
    // Formatar número para padrão WhatsApp
    formatNumber(number) {
        // Remove todos os caracteres não numéricos
        let cleaned = number.replace(/\D/g, '');
        
        // Adiciona @s.whatsapp.net
        return `${cleaned}@s.whatsapp.net`;
    }

    // Enviar mensagem de texto
    async sendText(instanceId, number, message) {
        try {
            const instance = baileysService.getInstance(instanceId);
            
            if (!instance) {
                throw new Error('Instance not found');
            }

            if (!instance.isConnected()) {
                throw new Error('Instance is not connected');
            }

            const jid = this.formatNumber(number);
            
            const result = await instance.sock.sendMessage(jid, {
                text: message
            });

            logger.info(`Text message sent to ${number} from instance ${instanceId}`);
            
            return {
                success: true,
                messageId: result.key.id,
                timestamp: result.messageTimestamp
            };
        } catch (error) {
            logger.error(`Error sending text message:`, error);
            throw error;
        }
    }

    // Enviar imagem
    async sendImage(instanceId, number, imageUrl, caption = '') {
        try {
            const instance = baileysService.getInstance(instanceId);
            
            if (!instance) {
                throw new Error('Instance not found');
            }

            if (!instance.isConnected()) {
                throw new Error('Instance is not connected');
            }

            const jid = this.formatNumber(number);
            
            // Download da imagem
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            const result = await instance.sock.sendMessage(jid, {
                image: buffer,
                caption: caption
            });

            logger.info(`Image sent to ${number} from instance ${instanceId}`);
            
            return {
                success: true,
                messageId: result.key.id,
                timestamp: result.messageTimestamp
            };
        } catch (error) {
            logger.error(`Error sending image:`, error);
            throw error;
        }
    }

    // Enviar áudio
    async sendAudio(instanceId, number, audioUrl) {
        try {
            const instance = baileysService.getInstance(instanceId);
            
            if (!instance) {
                throw new Error('Instance not found');
            }

            if (!instance.isConnected()) {
                throw new Error('Instance is not connected');
            }

            const jid = this.formatNumber(number);
            
            // Download do áudio
            const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            const result = await instance.sock.sendMessage(jid, {
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: true // Push to talk (áudio de voz)
            });

            logger.info(`Audio sent to ${number} from instance ${instanceId}`);
            
            return {
                success: true,
                messageId: result.key.id,
                timestamp: result.messageTimestamp
            };
        } catch (error) {
            logger.error(`Error sending audio:`, error);
            throw error;
        }
    }

    // Enviar vídeo
    async sendVideo(instanceId, number, videoUrl, caption = '') {
        try {
            const instance = baileysService.getInstance(instanceId);
            
            if (!instance) {
                throw new Error('Instance not found');
            }

            if (!instance.isConnected()) {
                throw new Error('Instance is not connected');
            }

            const jid = this.formatNumber(number);
            
            // Download do vídeo
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            const result = await instance.sock.sendMessage(jid, {
                video: buffer,
                caption: caption,
                mimetype: 'video/mp4'
            });

            logger.info(`Video sent to ${number} from instance ${instanceId}`);
            
            return {
                success: true,
                messageId: result.key.id,
                timestamp: result.messageTimestamp
            };
        } catch (error) {
            logger.error(`Error sending video:`, error);
            throw error;
        }
    }

    // Enviar localização
    async sendLocation(instanceId, number, latitude, longitude, name = '') {
        try {
            const instance = baileysService.getInstance(instanceId);
            
            if (!instance) {
                throw new Error('Instance not found');
            }

            if (!instance.isConnected()) {
                throw new Error('Instance is not connected');
            }

            const jid = this.formatNumber(number);

            const result = await instance.sock.sendMessage(jid, {
                location: {
                    degreesLatitude: latitude,
                    degreesLongitude: longitude,
                    name: name
                }
            });

            logger.info(`Location sent to ${number} from instance ${instanceId}`);
            
            return {
                success: true,
                messageId: result.key.id,
                timestamp: result.messageTimestamp
            };
        } catch (error) {
            logger.error(`Error sending location:`, error);
            throw error;
        }
    }

    // Enviar botão PIX
    async sendPix(instanceId, number, pixKey, amount, message) {
        try {
            const instance = baileysService.getInstance(instanceId);
            
            if (!instance) {
                throw new Error('Instance not found');
            }

            if (!instance.isConnected()) {
                throw new Error('Instance is not connected');
            }

            const jid = this.formatNumber(number);

            // Criar mensagem com botão PIX
            const pixMessage = {
                text: `${message}\n\n💰 Valor: R$ ${amount.toFixed(2)}\n🔑 Chave PIX: ${pixKey}`,
                footer: 'Clique no botão abaixo para copiar a chave PIX',
                buttons: [
                    {
                        buttonId: 'copy_pix',
                        buttonText: { displayText: '📋 Copiar Chave PIX' },
                        type: 1
                    }
                ],
                headerType: 1
            };

            const result = await instance.sock.sendMessage(jid, pixMessage);

            logger.info(`PIX button sent to ${number} from instance ${instanceId}`);
            
            return {
                success: true,
                messageId: result.key.id,
                timestamp: result.messageTimestamp,
                pixKey,
                amount
            };
        } catch (error) {
            logger.error(`Error sending PIX button:`, error);
            throw error;
        }
    }
}

export default new MessageService();
