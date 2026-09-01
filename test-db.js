const pool = require('./db');

async function testDatabase() {
    try {
        const result = await pool.query('SELECT NOW()');

        console.log('BAZA USPEŠNO RADI!');
        console.log('Vreme:', result.rows[0].now);

        await pool.end();
    } catch (error) {
        console.error('GREŠKA:', error.message);
    }
}

testDatabase();