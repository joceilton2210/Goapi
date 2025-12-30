import pg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'whatsapp',
    host: process.env.DB_HOST || 'postgres',
    database: process.env.DB_NAME || 'whatsapp',
    password: process.env.DB_PASSWORD || 'whatsapp_password',
    port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // logger.debug('executed query', { text, duration, rows: res.rowCount });
    return res;
};

export const getClient = async () => {
    const client = await pool.connect();
    return client;
};

// Initialize DB Tables
export const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Auth Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS auth_sessions (
                id VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id, type)
            );
        `);

        // Index for performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_auth_sessions_id ON auth_sessions(id);
        `);

        await client.query('COMMIT');
        logger.info('Database initialized successfully');
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error('Failed to initialize database', e);
        throw e;
    } finally {
        client.release();
    }
};
