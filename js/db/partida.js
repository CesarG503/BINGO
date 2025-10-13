const pool = require('./db'); // Importa tu conexión a la DB

/**
 * Guarda el patrón ganador para una partida específica.
 * @param {string} idPartida - El ID de la partida.
 * @param {Array<Array<string>>} patron - La matriz 5x5 del patrón (ej: [["1", "0", ...], ...]).
 * @returns {Promise<void>}
 */
async function guardarPatronGanador(idPartida, patron) {
    
    const patronJsonString = JSON.stringify(patron); 
    
    const query = `
        UPDATE Partidas
        SET patron_ganador = $1::jsonb
        WHERE id_partida = $2
        RETURNING id_partida;
    `;
    
    try {
        const result = await pool.query(query, [patronJsonString, idPartida]); 
        
        console.log(`Patrón guardado para partida ${idPartida}.`);
        return result.rows[0].id_partida;
    } catch (error) {

        console.error('Error en DB al guardar patrón:', error); 
        throw error;
    }
}

/**
 * Obtiene el patrón ganador de una partida.
 * @param {string} idPartida - El ID de la partida.
 * @returns {Promise<Array<Array<string>> | null>} La matriz del patrón o null si no se encuentra.
 */
async function obtenerPatronGanador(idPartida) {
    const query = `
        SELECT patron_ganador
        FROM Partidas
        WHERE id_partida = $1;
    `;
    const result = await pool.query(query, [idPartida]);
    if (result.rows.length > 0) {
        // La columna patron_ganador es JSONB/JSON, que se parsea a objeto/array de JS.
        return result.rows[0].patron_ganador;
    }
    return null;
}
async function getNumerosLlamados(idPartida) {
    const result = await pool.query(
        'SELECT numeros_llamados FROM Partidas WHERE id_partida = $1',
        [idPartida]
    );

    if (result.rows.length === 0 || !result.rows[0].numeros_llamados) {
        return [];
    }
    return result.rows[0].numeros_llamados || [];
}
// Asegúrate de exportar la nueva función
module.exports = {
    // ... otras funciones de partida que puedas tener ...
    guardarPatronGanador,
    getNumerosLlamados,
    obtenerPatronGanador
};