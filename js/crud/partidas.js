const express = require('express');
const pool = require('../db/db'); // Importar la conexión a la base de datos
const { authenticateToken, validateRole } = require('../authenthicated'); 

const router = express.Router();

router.post('/nueva', authenticateToken, validateRole(0), async (req, res) => {
    const { id_partida } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO Partidas (id_partida, host) VALUES ($1, $2) RETURNING *`,
            [id_partida, req.user.uid]
        );
        res.send(result.rows[0]);
    } catch (err) {
        console.error('Error creando partida:', err);
        res.status(500).json({ error: 'Error creando partida' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Partidas WHERE id_partida = $1', [req.params.id]);
        res.send(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo partida:', err);
        res.status(500).json({ error: 'Error obteniendo partida' });
    }
});

router.get('/:id/usuarios', authenticateToken, async (req, res) => {
    try {
        // Unir con la tabla Usuarios para obtener información de los usuarios en la partida
        const usuarios = await pool.query(
            `SELECT u.username, u.email, u.img_id
             FROM partida_usuario pu
             JOIN Usuarios u ON pu.id_usuario = u.id_usuario
             WHERE pu.id_partida = $1`,
            [req.params.id]
        );
        res.send(usuarios.rows);
    } catch (err) {
        console.error('Error obteniendo partidas:', err);
        res.status(500).json({ error: 'Error obteniendo partidas' });
    }
});

router.post('/:id/registrarse', authenticateToken, async (req, res) => {
    const { id } = req.params;
    console.log(`Usuario ${req.user.uid} intentando unirse a la partida ${id}`);
    try {
        // Verificar si el usuario ya está en la partida
        const checkUser = await pool.query(
            `SELECT * FROM partida_usuario WHERE id_partida = $1 AND id_usuario = $2`,
            [id, req.user.uid]
        );

        if (checkUser.rows.length > 0) {
            return res.status(201).json({registrado: false});
        }

        // Verificar que el usuario existe
        const userCheck = await pool.query("SELECT id_usuario FROM Usuarios WHERE id_usuario = $1", [req.user.uid])
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        // Verificar que la partida existe
        const cartonCheck = await pool.query("SELECT id_partida FROM Partidas WHERE id_partida = $1", [id])
        if (cartonCheck.rows.length === 0) {
            return res.status(404).json({ error: "Partida no encontrada" })
        }

        // Insertar el usuario en la partida
        await pool.query(
            `INSERT INTO partida_usuario (id_partida, id_usuario) 
             VALUES ($1, $2) RETURNING *`,
            [id, req.user.uid]
        );
        res.status(201).json({registrado: true})
    } catch (err) {
        console.error('Error uniendo a la partida:', err);
        res.status(500).json({ error: 'Error uniendo a la partida' });
    }
});

router.delete('/:id/abandonar', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `DELETE FROM partida_usuario WHERE id_partida = $1 AND id_usuario = $2 RETURNING *`,
            [id, req.user.uid]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Relación no encontrada' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Error eliminando relación partida-usuario:', err);
        res.status(500).json({ error: 'Error eliminando relación' });
    }
});

module.exports = router;