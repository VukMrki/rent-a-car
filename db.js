const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'apex_drive',
    user: 'postgres',
    password: 'postgres'
});

pool.on('connect', () => {
    console.log('PostgreSQL konekcija uspešna.');
});

pool.on('error', (err) => {
    console.error('PostgreSQL greška:', err);
});

module.exports = pool;