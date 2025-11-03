const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verifica a conexão inicial
db.getConnection((err, connection) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conexão ao banco de dados estabelecida com sucesso.');
        connection.release();
    }
});

// Testa a conexão a cada 10 segundos
setInterval(() => {
    db.query('SELECT 1', (err) => {
        if (err) {
            console.error('Conexão MySQL perdida. Tentando reconectar...', err);
        }
    });
    }, 10000);

    module.exports = db;