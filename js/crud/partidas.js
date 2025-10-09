const express = require("express")
const pool = require("../db/db") // Importar la conexión a la base de datos
const { authenticateToken, validateRole } = require("../authenthicated")

const router = express.Router()

router.post("/nueva", authenticateToken, validateRole(0), async (req, res) => {
  const { id_partida } = req.body
  try {
    const result = await pool.query(`INSERT INTO Partidas (id_partida, host) VALUES ($1, $2) RETURNING *`, [
      id_partida,
      req.user.uid,
    ])
    res.send(result.rows[0])
  } catch (err) {
    console.error("Error creando partida:", err)
    res.status(500).json({ error: "Error creando partida" })
  }
})

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Partidas WHERE id_partida = $1", [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Partida no encontrada" })
    }
    res.send(result.rows[0])
  } catch (err) {
    console.error("Error obteniendo partida:", err)
    res.status(500).json({ error: "Error obteniendo partida" })
  }
})

router.get("/:id/usuarios", authenticateToken, async (req, res) => {
  try {
    // Unir con la tabla Usuarios para obtener información de los usuarios en la partida
    const usuarios = await pool.query(
      `SELECT u.username, u.email, u.img_id
             FROM partida_usuario pu
             JOIN Usuarios u ON pu.id_usuario = u.id_usuario
             WHERE pu.id_partida = $1`,
      [req.params.id],
    )
    res.send(usuarios.rows)
  } catch (err) {
    console.error("Error obteniendo partidas:", err)
    res.status(500).json({ error: "Error obteniendo partidas" })
  }
})

router.post("/:id/registrarse", authenticateToken, async (req, res) => {
  const { id } = req.params
  console.log(`Usuario ${req.user.uid} intentando unirse a la partida ${id}`)
  try {
    // Verificar si el usuario ya está en la partida
    const checkUser = await pool.query(`SELECT * FROM partida_usuario WHERE id_partida = $1 AND id_usuario = $2`, [
      id,
      req.user.uid,
    ])

    if (checkUser.rows.length > 0) {
      return res.status(201).json({ registrado: false })
    }

    // Verificar que el usuario existe
    const userCheck = await pool.query("SELECT id_usuario FROM Usuarios WHERE id_usuario = $1", [req.user.uid])
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    //Verificar que la partida está activa
    const partidaEstado = await pool.query("SELECT estado FROM Partidas WHERE id_partida = $1", [id])
    if (partidaEstado.rows.length === 0) {
      return res.status(404).json({ error: "Partida no encontrada" })
    }
    
    if (partidaEstado.rows[0].estado !== 0) {
      return res.status(403).json({ error: "No se puede registrar si la partida ya está activa" })
    }

    // Verificar que la partida existe
    const partidaCheck = await pool.query("SELECT id_partida FROM Partidas WHERE id_partida = $1", [id])
    if (partidaCheck.rows.length === 0) {
      return res.status(404).json({ error: "Partida no encontrada" })
    }

    // Insertar el usuario en la partida
    await pool.query(
      `INSERT INTO partida_usuario (id_partida, id_usuario) 
             VALUES ($1, $2) RETURNING *`,
      [id, req.user.uid],
    )
    res.status(201).json({ registrado: true })
  } catch (err) {
    console.error("Error uniendo a la partida:", err)
    res.status(500).json({ error: "Error uniendo a la partida" })
  }
})

// Actualizar cartones de un usuario en una partida
router.put("/:id/usuario/cartones", authenticateToken, async (req, res) => {
  const { id } = req.params
  const { id_cartones } = req.body

  try {
    const result = await pool.query(
      `UPDATE partida_usuario SET id_cartones = $1 
             WHERE id_partida = $2 AND id_usuario = $3 RETURNING *`,
      [JSON.stringify(id_cartones), id, req.user.uid],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado en la partida" })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error actualizando cartones del usuario:", err)
    res.status(500).json({ error: "Error actualizando cartones del usuario" })
  }
})

// Obtener cartones de un usuario en una partida
router.get("/:id/usuario/cartones", authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      `SELECT id_cartones FROM partida_usuario 
             WHERE id_partida = $1 AND id_usuario = $2`,
      [id, req.user.uid],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado en la partida" })
    }

    res.json({ id_cartones: result.rows[0].id_cartones })
  } catch (err) {
    console.error("Error obteniendo cartones del usuario:", err)
    res.status(500).json({ error: "Error obteniendo cartones del usuario" })
  }
})

// Obtener partidas activas del usuario
router.get("/usuario/activas", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id_partida, p.estado, pu.id_cartones
             FROM Partidas p
             JOIN partida_usuario pu ON p.id_partida = pu.id_partida
             WHERE pu.id_usuario = $1 AND p.estado = 1`,
      [req.user.uid],
    )

    res.json(result.rows)
  } catch (err) {
    console.error("Error obteniendo partidas activas:", err)
    res.status(500).json({ error: "Error obteniendo partidas activas" })
  }
})

router.delete("/:id/abandonar", authenticateToken, async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      `DELETE FROM partida_usuario WHERE id_partida = $1 AND id_usuario = $2 RETURNING *`,
      [id, req.user.uid],
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Relación no encontrada" })
    }
    res.json({ success: true })
  } catch (err) {
    console.error("Error eliminando relación partida-usuario:", err)
    res.status(500).json({ error: "Error eliminando relación" })
  }
})

//Moficaciones de estado de la partida
router.put("/:id/estado", authenticateToken, validateRole(0), async (req, res) => {
  const { id } = req.params
  const { estado } = req.body
  try {
    const partidaCheck = await pool.query("SELECT host FROM Partidas WHERE id_partida = $1", [id])
    if (partidaCheck.rows[0].host !== req.user.uid) {
      return res.status(403).json({ error: "No tienes permiso para modificar esta partida" })
    }

    const result = await pool.query(`UPDATE Partidas SET estado = $1 WHERE id_partida = $2 RETURNING *`, [estado, id])
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Partida no encontrada" })
    }
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error("Error actualizando partida:", err)
    res.status(500).json({ error: "Error actualizando partida" })
  }
})

//Obtener si un usuario está registrado en una partida
router.get("/:id/registrado", authenticateToken, async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(`SELECT * FROM partida_usuario WHERE id_partida = $1 AND id_usuario = $2`, [
      id,
      req.user.uid,
    ])
    if (result.rows.length > 0) {
      return res.status(200).json({ registrado: true })
    } else {
      return res.status(200).json({ registrado: false })
    }
  } catch (err) {
    console.error("Error verificando registro en partida:", err)
    res.status(500).json({ error: "Error verificando registro en partida" })
  }
})

//Eliminar partida si el host desea eliminarla
router.delete("/:id", authenticateToken, validateRole(0), async (req, res) => {
  const { id } = req.params
  try {
    const partidaCheck = await pool.query("SELECT host FROM Partidas WHERE id_partida = $1", [id])
    if (partidaCheck.rows[0].host !== req.user.uid) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta partida" })
    }

   
    const deleteds = await pool.query(`DELETE FROM partida_usuario WHERE id_partida = $1 RETURNING *`, [id])
    if(deleteds.rowCount > 0){
      for (const row of deleteds.rows) {
        if (row.id_cartones) {
          const id_cartones = row.id_cartones
          for (const id_carton of id_cartones) {
            await pool.query(`DELETE FROM carton_usuario WHERE id_carton = $1`, [id_carton])
            await pool.query(`DELETE FROM Cartones WHERE id_carton = $1`, [id_carton])
          }
        }
      }
    }
    
    const result = await pool.query(`DELETE FROM Partidas WHERE id_partida = $1 RETURNING *`, [id])
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Partida no encontrada" })
    }

    const apiDelete = await fetch(`https://bingo-api.mixg-studio.workers.dev/api/partida/${id}/eliminar`)
    if (!apiDelete.ok) {
      console.error("Error al eliminar la partida en la API externa")
    }
    res.json({ success: true })
  } catch (err) {
    console.error("Error eliminando partida:", err)
    res.status(500).json({ error: "Error eliminando partida" })
  }
})

module.exports = router