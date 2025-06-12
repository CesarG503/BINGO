const express = require('express');
const path = require('path');
const cors = require('cors');
const pool = require('../db/db'); // ruta hacia db.js

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Servir HTML y JS desde raíz
app.use(express.static(path.join(__dirname, '../../')));

// Endpoint para obtener los datos del perfil
app.get('/api/usuario/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT username, email, creditos, img_id FROM Usuarios WHERE id_usuario = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


// Endpoint para actualizar datos del perfil
app.put('/api/usuario/:id', async (req, res) => {
    const { id } = req.params;
    const { username, email, img_id } = req.body;

    try {
        const result = await pool.query(
            'UPDATE usuarios SET username = $1, img_id = $2, email = $3 WHERE id_usuario = $4 RETURNING *',
            [username, img_id, email, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Perfil actualizado correctamente', usuario: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar el perfil:', error.message, error.stack);
        res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
});

