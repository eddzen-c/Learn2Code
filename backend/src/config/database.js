import { Pool } from 'pg';

import { env } from './env.js';

export const databasePool = new Pool({
    host: env.database.host,
    port: env.database.port,
    database: env.database.name,
    user: env.database.user,
    password: env.database.password,
    ssl: env.database.ssl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

databasePool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error.message);
});

export const checkDatabaseConnection = async () => {
    const result = await databasePool.query(`
    SELECT
      current_database() AS database,
      current_user AS "user"
  `);

    return result.rows[0];
};

export const closeDatabaseConnection = async () => {
    await databasePool.end();
};