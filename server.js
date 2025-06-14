const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // Importar path para manejar rutas de archivos
const pool = require('./js/db/db'); // Importar la conexión a la base de datos
const usuariosRouter = require('./js/crud/usuarios'); // Importar las rutas de Entrenadores.js

const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT =  process.env.PORT || 3000;

// Configurar CORS para aceptar cualquier origen (útil para pruebas móviles)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  authorization: true
}));

app.use(bodyParser.json());

// Configurar el servidor para servir archivos estáticos desde el directorio public
app.use(express.static(path.join(__dirname,'public')));

// Conexión a la base de datos
pool.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log("¡Conexión exitosa a la base de datos!");
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      'INSERT INTO Usuarios (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM Usuarios WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ email: user.correo, rol: user.rol }, 'secret_key', { expiresIn: '1h' });
      res.json({ token, userId: user.id, rol: user.rol }); // Enviar el token, ID y rol del usuario
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Configurar la ruta raíz para servir login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

//Colocar las rutas protegidas debajo de esta línea
app.get('/index', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/tienda', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect('/index');
    }
    if (user.rol === 0) {
      return res.sendFile(path.join(__dirname, 'public', 'tienda.html'));
    } else {
      return res.redirect('/index');
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar el rol del usuario' });
  }
});

//... y arriba de esta línea (crear un archivo de rutas protegidas)


// Usar ruta del CRUD Entrenadores.js
app.use('/api/usuarios', usuariosRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app; // Exportar la instancia de app, para ser usada en conexion.js
