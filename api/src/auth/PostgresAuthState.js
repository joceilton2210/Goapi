import { proto } from '@whiskeysockets/baileys';
import { BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

export const usePostgresAuthState = async (instanceId) => {
    // Helper to read data
    const readData = async (type) => {
        try {
            const res = await query(
                'SELECT data FROM auth_sessions WHERE id = $1 AND type = $2',
                [instanceId, type]
            );
            if (res.rows.length) {
                const data = res.rows[0].data;
                return JSON.parse(JSON.stringify(data), BufferJSON.reviver);
            }
            return null;
        } catch (error) {
            logger.error(`Error reading auth data (${type})`, error);
            return null;
        }
    };

    // Helper to write data
    const writeData = async (type, data) => {
        try {
            const jsonData = JSON.stringify(data, BufferJSON.replacer);
            await query(
                `INSERT INTO auth_sessions (id, type, data, updated_at) 
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (id, type) 
                 DO UPDATE SET data = $3, updated_at = NOW()`,
                [instanceId, type, jsonData]
            );
        } catch (error) {
            logger.error(`Error writing auth data (${type})`, error);
        }
    };

    // Helper to remove data
    const removeData = async (type) => {
        try {
            await query(
                'DELETE FROM auth_sessions WHERE id = $1 AND type = $2',
                [instanceId, type]
            );
        } catch (error) {
            logger.error(`Error removing auth data (${type})`, error);
        }
    };

    const creds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            if (value) {
                                data[id] = value;
                            }
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const type in data) {
                        for (const id in data[type]) {
                            const value = data[type][id];
                            const key = `${type}-${id}`;
                            if (value) {
                                tasks.push(writeData(key, value));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => {
            return writeData('creds', creds);
        }
    };
};
