const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({

  //conectar de manera local
  
  host: process.env.LOCAL,
  user: 'postgres',
  password: 'Amilcarito1', // Ingresa tu contraseña de PostgreSQL (cambiala loco)
  database: 'bingoDB',
  port: 5432
  
  // connectionString: process.env.DATA_BASE_URL,
  // ssl: {
  //   rejectUnauthorized: false, // << ESTA LÍNEA SOLUCIONA EL ERROR
  // },
});

pool.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log("¡Conexión exitosa a la base de datos!");
  }
});

module.exports = pool;
