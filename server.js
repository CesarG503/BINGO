const express = require('express');
const httpServer = require("http");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { authenticateToken, authenticateSocket, validateRole } = require('./js/authenthicated'); // Importar la función de autenticación
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path'); // Importar path para manejar rutas de archivos
const pool = require('./js/db/db'); // Importar la conexión a la base de datos
const usuariosRouter = require('./js/crud/usuarios');// Importar las rutas de Entrenadores.js
const partidasRouter = require('./js/crud/partidas'); // Importar las rutas de Partida.js
const partidaDB = require('./js/db/partida');
const cartonesRouter = require("./js/crud/cartones")
const cartonUsuarioRouter = require("./js/crud/carton_usuario")
const juegoRouter = require("./js/api/juego")
const nodemiler = require('nodemailer');
const crypto = require("crypto")
const { Email } = require('./js/email/email');
const {validarCarton,validarCartonConReferencia} = require('./js/bingo_validate');

const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src'));
const server = httpServer.createServer(app);
const PORT = process.env.PORT || 3000;

// Configurar CORS para aceptar cualquier origen (útil para pruebas móviles)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  authorization: true
}));

app.use(bodyParser.json());
app.use(cookieParser());

// Configurar el servidor para servir archivos estáticos desde el directorio public
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a la base de datos
pool.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log("¡Conexión exitosa a la base de datos!");
  }
});


app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    // Obtener una imagen de perfil aleatoria
    const directoryPath = path.join(__dirname, 'public', 'img', 'Flork');
    const files = fs.readdirSync(directoryPath);
    const imageFiles = files.filter(file => file.endsWith('.jpg'));
    const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    const img_id = randomImage.replace('.jpg', '');

    const result = await pool.query(
      'INSERT INTO Usuarios (username, email, password, img_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, hashedPassword, img_id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM Usuarios WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password)) 
      {
      const token = jwt.sign({ uid:user.id_usuario,  email: user.correo, rol: user.rol }, 'secret_key', { expiresIn: '24h' });
      res.json({ token, uid: user.id_usuario, rol: user.rol }); // Enviar el token, ID y rol del usuario
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Ruta para que el Host/Admin guarde el patrón ganador.
app.post('/api/partida/patron/:idPartida', authenticateToken, validateRole(0), async (req, res) => {
    const { idPartida } = req.params;
    const { patron } = req.body; // El frontend envía { patron: [["1","0",...], ...] }

    // *** NUEVA LÍNEA DE DEPURACIÓN ***
    console.log('Patrón recibido (tipo):', typeof patron);
    console.log('Patrón recibido (valor):', patron);
    console.log('Patrón recibido (JSON String):', JSON.stringify(patron));
    // **********************************

    // Validación básica
    if (!patron || !Array.isArray(patron) || patron.length !== 5 || patron.some(row => row.length !== 5)) {
        return res.status(400).json({ message: 'Patrón no válido. Debe ser una matriz 5x5.' });
    }

    try {
        // Usar la función de acceso a datos que creamos
        await partidaDB.guardarPatronGanador(idPartida, patron); 
        res.status(200).json({ message: 'Patrón ganador guardado con éxito.' });
    } catch (error) {
        console.error('Error al guardar el patrón ganador:', error);
        res.status(500).json({ message: 'Error interno del servidor al guardar el patrón.' });
    }
});

// Configurar la ruta raíz para servir login.html
app.get('/', (req, res) => {
  if (req.cookies.token) {
    // Si el usuario ya tiene un token, redirigir a la página de inicio
    return res.redirect('/index');
  }
  res.sendFile(path.join(__dirname, 'src', 'login.html'));
});

// Ruta pública para recuperación de contraseña
app.get('/recuperar', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'recuperarContra.html'));
});

//Colocar las rutas protegidas debajo de esta línea
app.get('/index', authenticateToken, (req, res) => {
  if (req.user.rol === 0) {
    res.sendFile(path.join(__dirname, 'src', 'admin_menu.html'));
  }
  else if (req.user.rol === 1) {
    res.sendFile(path.join(__dirname, 'src', 'home.html'));
  }
});

app.get('/tienda', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'tiendaUser.html'));
});

app.get('/documentacion', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'documentacion.html'));
});

app.get('/creditos', authenticateToken, validateRole(0), (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'tienda.html'));
});

app.get('/admin', authenticateToken, validateRole(0), (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'administrador.html'));
});

app.get('/logs', authenticateToken, validateRole(0), (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'logs.html'));
});

app.get('/perfil', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'perfil.html'));
});

app.get('/home', authenticateToken, (req, res) => {
  if (req.user.rol === 0) {
    res.sendFile(path.join(__dirname, 'src', 'admin_home.html'));
  }
  else {
    res.sendFile(path.join(__dirname, 'src', 'home.html'));
  }
});

//Ruta pára unirse a una sala como admin
/*app.get('/room/join', authenticateToken, validateRole(0), (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'home.html'));
});*/

app.get('/room/user/:roomId', authenticateToken, async (req, res) => {
  const roomId = req.params.roomId;
  res.render('user_room', { id_room: roomId });
});

app.get('/room/host/:roomId', authenticateToken, validateRole(0), async (req, res) => {
  const roomId = req.params.roomId;
  res.render('host_room', { id_room: roomId });
});

// ruta cambio de contraseña
app.get("/cambio-password", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "reset.html"))
})

// Endpoint para enviar email
app.post("/send-password-reset", async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: "Email es requerido" })
  }
  try {
    const userResult = await pool.query("SELECT id_usuario, username FROM Usuarios WHERE email = $1", [email])

    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: "Si el email existe, se enviará un enlace de recuperación",
      })
    }

    const user = userResult.rows[0]

    const resetToken = crypto.randomBytes(32).toString("hex") //token
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // Token expira en 24 horas

    await pool.query("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)", [
      user.id_usuario,
      resetToken,
      expiresAt,
    ])

    const baseUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === "production" ? "https://bingo-ivxo.onrender.com" : `http://localhost:${PORT}`)

    const resetUrl = `${baseUrl}/cambio-password?token=${resetToken}`

    const transporter = nodemiler.createTransport({
      service: 'gmail',
      auth: {
        user: 'bingoappues@gmail.com',
        pass: process.env.GOOGLE_API_KEY,
      },
    });

    const mailOptions = {
      from: 'bingoappues@gmail.com',
      to: email,
      subject: 'Recuperación de Contraseña - BINGO Game',
      html: Email(user, resetUrl),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error('Error al enviar:', error);
      }
      console.log('Correo enviado:', info.response);
    });

    res.json({
      success: true,
      message: "Enlace de cambio de contraseña enviado al correo electrónico",
    })
  } catch (error) {
    console.error("Error enviando email de recuperación:", error)
    res.status(500).json({
      error: "Error al enviar enlace de cambio de contraseña",
    })
  }
})

// ruta protegida con token de recuperación temporal
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token y nueva contraseña son requeridos" })
  }

  try {
    const tokenResult = await pool.query(
      `
      SELECT prt.*, u.id_usuario, u.email, u.username 
      FROM password_reset_tokens prt
      JOIN Usuarios u ON prt.user_id = u.id_usuario
      WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()
    `,
      [token],
    )

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        error: "Token inválido, expirado o ya utilizado",
      })
    }

    const tokenData = tokenResult.rows[0]

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await pool.query("UPDATE Usuarios SET password = $1 WHERE id_usuario = $2", [hashedPassword, tokenData.user_id])

    await pool.query("UPDATE password_reset_tokens SET used = TRUE WHERE token = $1", [token])

    await pool.query("DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE")

    console.log(`Contraseña cambiada exitosamente para usuario: ${tokenData.username}`)

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    })
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error)
    res.status(500).json({
      error: "Error al cambiar la contraseña",
    })
  }
})

// Endpoint para validar token de recuperación
app.get("/validate-reset-token/:token", async (req, res) => {
  const { token } = req.params

  try {
    const result = await pool.query(
      `
      SELECT u.username 
      FROM password_reset_tokens prt
      JOIN Usuarios u ON prt.user_id = u.id_usuario
      WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()
    `,
      [token],
    )

    if (result.rows.length === 0) {
      return res.status(400).json({
        valid: false,
        error: "Token inválido o expirado",
      })
    }

    res.json({
      valid: true,
      username: result.rows[0].username,
    })
  } catch (error) {
    console.error("Error validando token:", error)
    res.status(500).json({
      valid: false,
      error: "Error del servidor",
    })
  }
})

//... y arriba de esta línea (crear un archivo de rutas protegidas)


// Usar ruta del CRUD usuarios.js
app.use('/api/usuarios', usuariosRouter);

// CRUD cartones 
app.use("/api/cartones", cartonesRouter)
app.use("/api/carton-usuario", cartonUsuarioRouter)

// Usar ruta del CRUD partidas.js
app.use('/api/partidas', partidasRouter);

const logTransaccionesRouter = require("./js/crud/log_transacciones")
app.use("/api/log-transacciones", logTransaccionesRouter)

app.get('/api/profile-images', (req, res) => {
  const directoryPath = path.join(__dirname, 'public', 'img', 'Flork');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading profile images directory:', err);
      return res.status(500).json({ error: 'Unable to scan images directory' });
    }
    const imageFiles = files.filter(file => file.endsWith('.jpg')).map(file => file.replace('.jpg', ''));
    res.json(imageFiles);
  });
});

//rutas para API de juego
app.use('/api/juego', juegoRouter);

//Inicializar Socket.IO
const io = new Server(server);

// Configurar Socket.IO para manejar la autenticación
io.use((socket, next) => authenticateSocket(socket, next));

// Manejar eventos de conexión de Socket.IO
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  socket.on('unirseSala', (id_room) => { socket.join(id_room); });

  socket.on('nuevoUsuario', (data) => {
    io.to(data.id_room).emit('nuevoUsuario', data);
  });

  socket.on('abandonarSala', (id_room) => {
    socket.leave(id_room);
    io.to(id_room).emit('usuarioAbandono');
  });

  socket.on('salaEliminada', (data) => {
    if (socket.user.rol !== 0 || socket.user.uid !== data.host) {
      console.log(`Usuario sin permiso accedio para eliminar la sala ${data.id_room}`);
      return socket.emit('error', 'No tienes permiso para eliminar la sala');
    }
    io.to(data.id_room).emit('salaEliminada');
    socket.leave(data.id_room);
  });

  socket.on('iniciarSala', async (data) => {
    if (socket.user.rol !== 0 || socket.user.uid !== data.host) {
      console.log(`Usuario sin permiso accedio para iniciar la sala ${data.id_room}`);
      return socket.emit('error', 'No tienes permiso para iniciar la sala');
    }
    try {
      const patron = await partidaDB.obtenerPatronGanador(data.id_room);
      io.to(data.id_room).emit('inicioSala', { patron });
    } catch (error) {
      console.error('Error al obtener el patrón y emitir inicioSala:', error);
      // Emitir de todas formas para que el juego comience, pero sin el patrón
      io.to(data.id_room).emit('inicioSala', { patron: null });
    }
  });

  socket.on('patronActualizado', (data) => {
    if (socket.user.rol !== 0) {
      return socket.emit('error', 'No tienes permiso para actualizar el patrón.');
    }
    // Re-emitir el patrón a todos en la sala, incluyendo al host
    io.to(data.id_room).emit('mostrarPatron', { patron: data.patron });
  });

  socket.on('getNuevoNumero', (data) => {
    if (socket.user.rol !== 0 || socket.user.uid !== data.host) {
      console.log(`Usuario sin permiso accedio para enviar un nuevo numero en la sala ${data.id_room}`);
      return socket.emit('error', 'No tienes permiso para enviar un nuevo número');
    }

    io.to(data.id_room).emit('nuevoNumero', data.extraido);
  });

  socket.on('callBingo', async (data) => {
    // Validar el cartón del usuario
    const numerosGanadores = await validarCarton(data.carton, data.numerosSeleccionados, data.id_room);
    if (numerosGanadores.length === 0) {
      return socket.emit('errorCarton', 'Cartón inválido o no hay bingo');
    }

    const newData = {
      ganador: data.ganador,
      numerosGanadores: numerosGanadores,
      numerosSeleccionados: data.numerosSeleccionados,
      carton: data.carton,
      id_room: data.id_room,
    }
    
    socket.emit("eresGanador", newData );
    io.to(data.id_room).emit('ganador', newData);
  });

  // Manejar eventos de desconexion
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Redirigir cualquier otra ruta a la página de inicio
app.use((req, res) => {
  if (req.path === '/') {
    return res.status(404).send('Página no encontrada');
  }
  res.redirect('/');
});

server.listen(PORT, () => {
  console.log(`Server running on ${process.env.API_BASE_URL}`);
});

module.exports = app; // Exportar la instancia de app, para ser usada en conexion.js
