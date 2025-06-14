const express = require("express")
const pool = require("../db/db") // Importar la conexión a la base de datos
const { authenticateToken } = require("../authenthicated") // Importar la función de autenticación

const router = express.Router()

// Obtener todos los cartones
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Cartones ORDER BY id_carton DESC")
    res.send(result.rows)
  } catch (err) {
    console.error("Error fetching cartones:", err)
    res.status(500).json({ error: "Error fetching cartones" })
  }
})

// Obtener un cartón por ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Cartones WHERE id_carton = $1", [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cartón no encontrado" })
    }
    res.send(result.rows[0])
  } catch (err) {
    console.error("Error fetching carton:", err)
    res.status(500).json({ error: "Error fetching carton" })
  }
})

// Crear un nuevo cartón
router.post("/", authenticateToken, async (req, res) => {
  const { carton } = req.body

  if (!carton) {
    return res.status(400).json({ error: "El campo carton es requerido" })
  }

  try {
    const result = await pool.query("INSERT INTO Cartones (carton) VALUES ($1) RETURNING *", [JSON.stringify(carton)])
    res.status(201).send(result.rows[0])
  } catch (err) {
    console.error("Error creating carton:", err)
    res.status(500).json({ error: "Error creando cartón" })
  }
})

// Crear múltiples cartones
router.post("/bulk", authenticateToken, async (req, res) => {
  const { cartones } = req.body

  if (!cartones || !Array.isArray(cartones) || cartones.length === 0) {
    return res.status(400).json({ error: "El campo cartones debe ser un array no vacío" })
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const insertedCartones = []

    for (const carton of cartones) {
      const result = await client.query("INSERT INTO Cartones (carton) VALUES ($1) RETURNING *", [
        JSON.stringify(carton),
      ])
      insertedCartones.push(result.rows[0])
    }

    await client.query("COMMIT")
    res.status(201).json(insertedCartones)
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Error creating bulk cartones:", err)
    res.status(500).json({ error: "Error creando cartones en lote" })
  } finally {
    client.release()
  }
})

// Actualizar un cartón
router.put("/:id", authenticateToken, async (req, res) => {
  const { carton } = req.body

  if (!carton) {
    return res.status(400).json({ error: "El campo carton es requerido" })
  }

  try {
    const result = await pool.query("UPDATE Cartones SET carton = $1 WHERE id_carton = $2 RETURNING *", [
      JSON.stringify(carton),
      req.params.id,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cartón no encontrado" })
    }

    res.send(result.rows[0])
  } catch (err) {
    console.error("Error updating carton:", err)
    res.status(500).json({ error: "Error actualizando cartón" })
  }
})

// Eliminar un cartón
router.delete("/:id", authenticateToken, async (req, res) => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    // Primero eliminar las referencias en carton_usuario
    await client.query("DELETE FROM carton_usuario WHERE id_carton = $1", [req.params.id])

    // Luego eliminar el cartón
    const result = await client.query("DELETE FROM Cartones WHERE id_carton = $1 RETURNING *", [req.params.id])

    if (result.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Cartón no encontrado" })
    }

    await client.query("COMMIT")
    res.send(result.rows[0])
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Error deleting carton:", err)
    res.status(500).json({ error: "Error eliminando cartón" })
  } finally {
    client.release()
  }
})

module.exports = router