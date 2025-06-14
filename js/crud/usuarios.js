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
    const result = await pool.query('SELECT * FROM Usuarios WHERE id_usuario = $1', [req.user.uid]);
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
router.post('/', authenticateToken, async (req, res) => {
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
router.put('/:id', authenticateToken, validateRole(0), async (req, res) => {
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
