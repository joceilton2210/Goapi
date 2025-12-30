import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

const logger = pino({ level: 'trace' });

async function testConnection() {
    console.log('🧪 Testing Baileys Connection...\n');

    const { state, saveCreds } = await useMultiFileAuthState('./test_auth');
    const { version } = await fetchLatestBaileysVersion();

    console.log(`✓ Baileys version: ${version.join('.')}`);
    console.log(`✓ Auth state loaded\n`);

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: ['Test', 'Chrome', '10.0'],
        markOnlineOnConnect: true
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        console.log(`📊 Connection update: ${connection || 'no-change'}`);

        if (qr) {
            console.log('\n📱 QR Code generated! Scan with WhatsApp:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`❌ Connection closed. Reconnect: ${shouldReconnect}`);
            
            if (!shouldReconnect) {
                process.exit(0);
            }
        }

        if (connection === 'open') {
            console.log('\n✓✓✓ CONNECTED SUCCESSFULLY! ✓✓✓');
            console.log(`Phone: ${sock.user.id}`);
            console.log(`Name: ${sock.user.name}\n`);
            
            console.log('✓ Test passed! Connection works.');
            console.log('Press Ctrl+C to exit.\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

testConnection().catch(console.error);
