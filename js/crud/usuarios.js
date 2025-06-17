const express = require('express');
const pool = require('../db/db'); // Importar la conexión a la base de datos
const { authenticateToken, validateRole } = require('../authenthicated'); // Importar la función de autenticación

const router = express.Router();

// Obtener todos los usuarios
router.get('/', authenticateToken, validateRole(0), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Usuarios');
    res.send(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching usuarios' });
  }
});

//Obtener informacion del usuario autenticado
router.get('/actual', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id_usuario, username, creditos, email, rol, img_id FROM Usuarios WHERE id_usuario = $1', [req.user.uid]);
    res.send(result.rows[0]);
  } catch (err) {
    console.error('Error fetching usuario:', err);
    res.status(500).json({ error: 'Error fetching usuario' });
  }
});

// Actualizar perfil del usuario autenticado
router.put('/actual/perfil', authenticateToken, async (req, res) => {
  const { username, email, img_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE Usuarios SET username = $1, email = $2, img_id = $3 WHERE id_usuario = $4 RETURNING *`,
      [username,email,img_id, req.user.uid]
    );
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando imagen de usuario' });
  }
});

// actualizar creditos
router.put("/actual/creditos", authenticateToken, async (req, res) => {
  const { creditos } = req.body

  if (typeof creditos !== "number" || creditos < 0) {
    return res.status(400).json({ error: "Los créditos deben ser un número válido mayor o igual a 0" })
  }

  try {
    const result = await pool.query(
      `UPDATE Usuarios SET creditos = $1 WHERE id_usuario = $2 RETURNING id_usuario, username, creditos, email, rol, img_id`,
      [creditos, req.user.uid],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.send(result.rows[0])
  } catch (err) {
    console.error("Error actualizando créditos:", err)
    res.status(500).json({ error: "Error actualizando créditos del usuario" })
  }
})

// Obtener un usuario por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Usuarios WHERE id_usuario = $1', [req.params.id]);
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching usuario' });
  }
});

// Crear un nuevo usuario
router.post('/', async (req, res) => {
  const { username, password, rol = 1, creditos = 0, img_id, email } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO Usuarios (username, password, rol, creditos, img_id, email)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [username, password, rol, creditos, img_id, email]
    );
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

// Actualizar un usuario
router.put('/:id', authenticateToken, async (req, res) => {
  const { username, password, rol, creditos, img_id, email } = req.body;
  try {
    const result = await pool.query(
      `UPDATE Usuarios SET username = $1, password = $2, rol = $3, creditos = $4, img_id = $5, email = $6
       WHERE id_usuario = $7 RETURNING *`,
      [username, password, rol, creditos, img_id, email, req.params.id]
    );
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
});

// Borrar un usuario
router.delete('/:id', authenticateToken, validateRole(0), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM Usuarios WHERE id_usuario = $1 RETURNING *', [req.params.id]);
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error borrando usuario' });
  }
});

module.exports = router;
