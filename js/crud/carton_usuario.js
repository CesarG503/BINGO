const express = require("express")
const pool = require("../db/db") // Importar la conexión a la base de datos
const { authenticateToken } = require("../authenthicated") // Importar la función de autenticación

const router = express.Router()

// Obtener todos los cartones de un usuario específico
router.get("/usuario/:userId", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        cu.id_carton_usuario,
        cu.id_usuario,
        cu.id_carton,
        c.carton,
        u.username
      FROM carton_usuario cu
      JOIN Cartones c ON cu.id_carton = c.id_carton
      JOIN Usuarios u ON cu.id_usuario = u.id_usuario
      WHERE cu.id_usuario = $1
      ORDER BY cu.id_carton_usuario DESC
    `,
      [req.params.userId],
    )

    res.json(result.rows)
  } catch (err) {
    console.error("Error fetching user cartones:", err)
    res.status(500).json({ error: "Error obteniendo cartones del usuario" })
  }
})

// Obtener todos los usuarios que tienen un cartón específico
router.get("/carton/:cartonId", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        cu.id_carton_usuario,
        cu.id_usuario,
        cu.id_carton,
        u.username,
        u.email
      FROM carton_usuario cu
      JOIN Usuarios u ON cu.id_usuario = u.id_usuario
      WHERE cu.id_carton = $1
      ORDER BY cu.id_carton_usuario DESC
    `,
      [req.params.cartonId],
    )

    res.json(result.rows)
  } catch (err) {
    console.error("Error fetching carton users:", err)
    res.status(500).json({ error: "Error obteniendo usuarios del cartón" })
  }
})

// Obtener todas las relaciones carton_usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        cu.id_carton_usuario,
        cu.id_usuario,
        cu.id_carton,
        c.carton,
        u.username,
        u.email
      FROM carton_usuario cu
      JOIN Cartones c ON cu.id_carton = c.id_carton
      JOIN Usuarios u ON cu.id_usuario = u.id_usuario
      ORDER BY cu.id_carton_usuario DESC
    `)

    res.json(result.rows)
  } catch (err) {
    console.error("Error fetching carton_usuario:", err)
    res.status(500).json({ error: "Error obteniendo relaciones cartón-usuario" })
  }
})

// Asignar un cartón a un usuario
router.post("/", authenticateToken, async (req, res) => {
  const { id_usuario, id_carton } = req.body

  if (!id_usuario || !id_carton) {
    return res.status(400).json({ error: "id_usuario e id_carton son requeridos" })
  }

  try {
    // Verificar que el usuario existe
    const userCheck = await pool.query("SELECT id_usuario FROM Usuarios WHERE id_usuario = $1", [id_usuario])
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    // Verificar que el cartón existe
    const cartonCheck = await pool.query("SELECT id_carton FROM Cartones WHERE id_carton = $1", [id_carton])
    if (cartonCheck.rows.length === 0) {
      return res.status(404).json({ error: "Cartón no encontrado" })
    }

    // Crear la relación
    const result = await pool.query("INSERT INTO carton_usuario (id_usuario, id_carton) VALUES ($1, $2) RETURNING *", [
      id_usuario,
      id_carton,
    ])

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error("Error creating carton_usuario:", err)
    if (err.code === "23505") {
      // Unique violation
      res.status(409).json({ error: "Esta relación cartón-usuario ya existe" })
    } else {
      res.status(500).json({ error: "Error asignando cartón al usuario" })
    }
  }
})

// Asignar múltiples cartones a un usuario
router.post("/bulk", authenticateToken, async (req, res) => {
  const { id_usuario, cartones_ids } = req.body

  if (!id_usuario || !cartones_ids || !Array.isArray(cartones_ids) || cartones_ids.length === 0) {
    return res.status(400).json({ error: "id_usuario y cartones_ids (array) son requeridos" })
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    // Verificar que el usuario existe
    const userCheck = await client.query("SELECT id_usuario FROM Usuarios WHERE id_usuario = $1", [id_usuario])
    if (userCheck.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    const insertedRelations = []

    for (const id_carton of cartones_ids) {
      // Verificar que el cartón existe
      const cartonCheck = await client.query("SELECT id_carton FROM Cartones WHERE id_carton = $1", [id_carton])
      if (cartonCheck.rows.length === 0) {
        await client.query("ROLLBACK")
        return res.status(404).json({ error: `Cartón con ID ${id_carton} no encontrado` })
      }

      // Crear la relación
      const result = await client.query(
        "INSERT INTO carton_usuario (id_usuario, id_carton) VALUES ($1, $2) RETURNING *",
        [id_usuario, id_carton],
      )
      insertedRelations.push(result.rows[0])
    }

    await client.query("COMMIT")
    res.status(201).json(insertedRelations)
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Error creating bulk carton_usuario:", err)
    if (err.code === "23505") {
      // Unique violation
      res.status(409).json({ error: "Una o más relaciones cartón-usuario ya existen" })
    } else {
      res.status(500).json({ error: "Error asignando cartones al usuario" })
    }
  } finally {
    client.release()
  }
})

// Eliminar una relación cartón-usuario específica
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM carton_usuario WHERE id_carton_usuario = $1 RETURNING *", [
      req.params.id,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Relación cartón-usuario no encontrada" })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error deleting carton_usuario:", err)
    res.status(500).json({ error: "Error eliminando relación cartón-usuario" })
  }
})

// Eliminar todos los cartones de un usuario
router.delete("/usuario/:userId", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM carton_usuario WHERE id_usuario = $1 RETURNING *", [req.params.userId])

    res.json({
      message: `Se eliminaron ${result.rows.length} cartones del usuario`,
      deletedRelations: result.rows,
    })
  } catch (err) {
    console.error("Error deleting user cartones:", err)
    res.status(500).json({ error: "Error eliminando cartones del usuario" })
  }
})

// Eliminar un cartón específico de un usuario específico
router.delete("/usuario/:userId/carton/:cartonId", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM carton_usuario WHERE id_usuario = $1 AND id_carton = $2 RETURNING *", [
      req.params.userId,
      req.params.cartonId,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Relación cartón-usuario no encontrada" })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error deleting specific carton_usuario:", err)
    res.status(500).json({ error: "Error eliminando cartón específico del usuario" })
  }
})

module.exports = router
