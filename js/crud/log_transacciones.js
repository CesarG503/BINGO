const express = require("express")
const pool = require("../db/db")
const { authenticateToken, validateRole } = require("../authenthicated")

const router = express.Router()

// Obtener todos los logs de transacciones (solo admin)
router.get("/", authenticateToken, validateRole(0), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        lt.*,
        ue.username as emisor_username,
        ur.username as receptor_username
      FROM LogTransacciones lt
      JOIN Usuarios ue ON lt.id_emisor = ue.id_usuario
      JOIN Usuarios ur ON lt.id_receptor = ur.id_usuario
      ORDER BY lt.fecha DESC
    `)
    res.send(result.rows)
  } catch (err) {
    console.error("Error fetching log transacciones:", err)
    res.status(500).json({ error: "Error fetching log transacciones" })
  }
})

// Obtener logs de transacciones por usuario receptor
router.get("/receptor/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        lt.*,
        ue.username as emisor_username,
        ur.username as receptor_username
      FROM LogTransacciones lt
      JOIN Usuarios ue ON lt.id_emisor = ue.id_usuario
      JOIN Usuarios ur ON lt.id_receptor = ur.id_usuario
      WHERE lt.id_receptor = $1
      ORDER BY lt.fecha DESC
    `,
      [req.params.id],
    )
    res.send(result.rows)
  } catch (err) {
    console.error("Error fetching log transacciones por receptor:", err)
    res.status(500).json({ error: "Error fetching log transacciones" })
  }
})

// Obtener logs de transacciones por usuario emisor
router.get("/emisor/:id", authenticateToken, validateRole(0), async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        lt.*,
        ue.username as emisor_username,
        ur.username as receptor_username
      FROM LogTransacciones lt
      JOIN Usuarios ue ON lt.id_emisor = ue.id_usuario
      JOIN Usuarios ur ON lt.id_receptor = ur.id_usuario
      WHERE lt.id_emisor = $1
      ORDER BY lt.fecha DESC
    `,
      [req.params.id],
    )
    res.send(result.rows)
  } catch (err) {
    console.error("Error fetching log transacciones por emisor:", err)
    res.status(500).json({ error: "Error fetching log transacciones" })
  }
})

// Crear un nuevo log de transacción
router.post("/", authenticateToken, validateRole(0), async (req, res) => {
  const { id_receptor, cantidad, tipo_operacion = "asignacion" } = req.body
  const id_emisor = req.user.uid // El admin que está asignando los créditos

  if (!id_receptor || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: "Datos inválidos. Se requiere id_receptor y cantidad mayor a 0" })
  }

  try {
    const result = await pool.query(
      `INSERT INTO LogTransacciones (id_emisor, id_receptor, cantidad, tipo_operacion)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_emisor, id_receptor, cantidad, tipo_operacion],
    )
    res.send(result.rows[0])
  } catch (err) {
    console.error("Error creando log transacción:", err)
    res.status(500).json({ error: "Error creando log transacción" })
  }
})

// Obtener un log por ID
router.get("/:id", authenticateToken, validateRole(0), async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        lt.*,
        ue.username as emisor_username,
        ur.username as receptor_username
      FROM LogTransacciones lt
      JOIN Usuarios ue ON lt.id_emisor = ue.id_usuario
      JOIN Usuarios ur ON lt.id_receptor = ur.id_usuario
      WHERE lt.id_log = $1
    `,
      [req.params.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Log no encontrado" })
    }

    res.send(result.rows[0])
  } catch (err) {
    console.error("Error fetching log transacción:", err)
    res.status(500).json({ error: "Error fetching log transacción" })
  }
})

// Eliminar un log (solo para casos excepcionales)
router.delete("/:id", authenticateToken, validateRole(0), async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM LogTransacciones WHERE id_log = $1 RETURNING *", [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Log no encontrado" })
    }

    res.send(result.rows[0])
  } catch (err) {
    console.error("Error borrando log transacción:", err)
    res.status(500).json({ error: "Error borrando log transacción" })
  }
})

router.get("/stats/by-admin", authenticateToken, validateRole(0), async (req, res) => {
  try {
    // Get total credits sold
    const totalResult = await pool.query(`
      SELECT COALESCE(SUM(cantidad), 0) as total_creditos
      FROM LogTransacciones
      WHERE tipo_operacion = 'asignacion'
    `)

    // Get credits sold by each admin
    const adminStatsResult = await pool.query(`
      SELECT 
        u.id_usuario,
        u.username,
        u.email,
        COALESCE(SUM(lt.cantidad), 0) as total_vendido,
        COUNT(lt.id_log) as num_transacciones
      FROM Usuarios u
      LEFT JOIN LogTransacciones lt ON u.id_usuario = lt.id_emisor AND lt.tipo_operacion = 'asignacion'
      WHERE u.rol = 0
      GROUP BY u.id_usuario, u.username, u.email
      ORDER BY total_vendido DESC
    `)

    res.json({
      total_creditos: Number.parseInt(totalResult.rows[0].total_creditos),
      admins: adminStatsResult.rows.map((row) => ({
        id_usuario: row.id_usuario,
        username: row.username,
        email: row.email,
        total_vendido: Number.parseInt(row.total_vendido),
        num_transacciones: Number.parseInt(row.num_transacciones),
      })),
    })
  } catch (err) {
    console.error("Error fetching admin stats:", err)
    res.status(500).json({ error: "Error fetching admin stats" })
  }
})

router.get("/by-admin/:id", authenticateToken, validateRole(0), async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        lt.*,
        ur.username as receptor_username,
        ur.email as receptor_email
      FROM LogTransacciones lt
      JOIN Usuarios ur ON lt.id_receptor = ur.id_usuario
      WHERE lt.id_emisor = $1 AND lt.tipo_operacion = 'asignacion'
      ORDER BY lt.fecha DESC
    `,
      [req.params.id],
    )
    res.send(result.rows)
  } catch (err) {
    console.error("Error fetching transactions by admin:", err)
    res.status(500).json({ error: "Error fetching transactions" })
  }
})

module.exports = router
