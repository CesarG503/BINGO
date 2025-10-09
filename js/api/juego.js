const express = require('express');
const pool = require('../db/db');
const { authenticateToken } = require('../authenthicated');
const {getNext, generateUniqueId} = require('../ramdon').default;

const router = express.Router();

router.get('/crear', authenticateToken, async (req, res) => {
    try {
        let uniqueId;
        let exists = true;
        while (exists) {
            uniqueId = generateUniqueId();
            const check = await pool.query('SELECT 1 FROM partidas WHERE id_partida = $1', [uniqueId]);
            exists = check.rows.length > 0;
        }
        res.json({ id: uniqueId });
    } catch (error) {
        console.error('Error al crear el id único:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

router.get('/extraer/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    try {
        const uid = req.user.uid;
        const partidaResult = await pool.query('SELECT numeros_llamados,host FROM partidas WHERE id_partida = $1', [id]);
        if (partidaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }

        if(partidaResult.rows[0].host !== uid){
            return res.status(403).json({ error: 'No autorizado. Solo el host puede obtener el siguiente número.' });
        }

        let numeros = partidaResult.rows[0].numeros_llamados || [];
        let [numerosNuevos,nuevoNumero] = await getNext(numeros);

        await pool.query('UPDATE partidas SET numeros_llamados = $1 WHERE id_partida = $2', [JSON.stringify(numerosNuevos), id]);
        res.json({"extraido":nuevoNumero, "numeros": numeros });
    } catch (error) {
        console.error('Error al obtener el siguiente número:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

router.get('/estado/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    try {
        const partidaResult = await pool.query('SELECT numeros_llamados FROM partidas WHERE id_partida = $1', [id]);
        if (partidaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Partida no encontrada' });
        }

        let numeros = partidaResult.rows[0].numeros_llamados || [];
        res.json({"id":id,"numbers": numeros });
    } catch (error) {
        console.error('Error al obtener el estado de la partida:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;