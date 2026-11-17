const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src'));

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set mock token cookie automatically on every request if missing
app.use((req, res, next) => {
  if (!req.cookies.token) {
    res.cookie('token', 'mock_jwt_token_for_preview', { path: '/' });
  }
  next();
});

// Generar 60 jugadores simulados para probar salas masivas
const nombresEjemplo = [
  'Flork_Master', 'RetroPlayer', 'NeonGamer', 'CyberSamurai', 'PixelQueen',
  'BingoChamp', 'LuckyStrike', 'CosmoKnight', 'LunaStar', 'ShadowNinja',
  'ViperStrike', 'TurboGamer', 'GoldenDice', 'ArcadeHero', 'NovaBlaze',
  'MegaWin', 'StarLord', 'QuantumLeap', 'HyperSonic', 'GalacticAce',
  'OmegaRed', 'EchoVector', 'AstroBoy', 'BlazeRider', 'SolarFlare',
  'DarkPhoenix', 'IronFist', 'LaserEye', 'ThunderBolt', 'StormRider',
  'FrostBite', 'InfernoX', 'GhostRider', 'Specter99', 'PhantomAce',
  'TitanKing', 'ZeusThunder', 'AresWar', 'ApolloSun', 'HermesFast',
  'AtlasPrime', 'OrionHunter', 'PhoenixFire', 'DragonSlayer', 'FalconPunch',
  'HawkEye', 'EagleVision', 'WolfPack', 'TigerClaw', 'LionHeart',
  'BearGrizzly', 'PantherBlack', 'CobraCommander', 'SharkBite', 'RhinoCharge',
  'BullsEye', 'ScorpionTail', 'SpiderWeb', 'MantisStrike', 'GamerPro60'
];

const mockUsuarios = [
  { id_usuario: 1, username: 'Host_Admin', img_id: '3', rol: 0 },
  ...nombresEjemplo.map((nombre, idx) => ({
    id_usuario: idx + 2,
    username: nombre,
    img_id: String((idx % 20) + 1), // cicla entre las 20 imágenes de Flork
    rol: 1
  }))
];

const mockCarton1 = [
  [7, 22, 38, 51, 68],
  [14, 19, 41, 55, 74],
  [3, 29, 'FREE', 48, 62],
  [11, 16, 33, 59, 70],
  [8, 25, 44, 52, 65]
];

const mockCarton2 = [
  [5, 20, 35, 50, 65],
  [12, 17, 43, 57, 71],
  [2, 27, 'FREE', 46, 63],
  [9, 24, 39, 53, 69],
  [15, 30, 45, 60, 75]
];

// Mock API Endpoints
app.get('/api/partidas/:id', (req, res) => {
  res.json({
    id_partida: req.params.id,
    host: 1,
    estado: 0,
    numeros_llamados: []
  });
});

app.get('/api/usuarios/actual', (req, res) => {
  const referer = req.headers.referer || '';
  if (referer.includes('/room/host')) {
    return res.json({
      id_usuario: 1,
      username: 'Host_Admin',
      img_id: '3',
      rol: 0,
      creditos: 999
    });
  }
  res.json({
    id_usuario: 2,
    username: 'Flork_Master',
    img_id: '1',
    rol: 1,
    creditos: 150
  });
});

app.get('/api/partidas/:id/registrado', (req, res) => {
  res.json({ registrado: true });
});

app.get('/api/partidas/:id/usuarios', (req, res) => {
  res.json(mockUsuarios);
});

app.get('/api/partidas/:id/usuario/cartones', (req, res) => {
  res.json({ id_cartones: [101, 102] });
});

app.put('/api/partidas/:id/usuario/cartones', (req, res) => {
  res.json({ success: true });
});

app.get('/api/cartones/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === 102) {
    res.json({ id_carton: 102, carton: mockCarton2 });
  } else {
    res.json({ id_carton: 101, carton: mockCarton1 });
  }
});

app.get('/api/juego/estado/:id', (req, res) => {
  res.json({ numeros_llamados: [] });
});

app.delete('/api/partidas/:id/abandonar', (req, res) => {
  res.json({ success: true });
});

const bannerHtml = `
<div id="preview-nav-bar" style="position: sticky; top: 0; left: 0; width: 100%; z-index: 99999; background: #0f172a; border-bottom: 2px solid #00f0ff; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 20px rgba(0,240,255,0.2); font-family: system-ui, sans-serif;">
  <div style="display: flex; align-items: center; gap: 12px;">
    <span style="font-size: 20px;">🎲</span>
    <span style="color: #00f0ff; font-weight: bold; font-size: 15px; letter-spacing: 0.5px;">BINGO - SALA DE ESPERA (PREVIEW)</span>
    <span style="background: #1e293b; color: #94a3b8; padding: 3px 10px; border-radius: 999px; font-size: 12px;">ID: SALA-BINGO-42</span>
  </div>
  <div style="display: flex; gap: 10px;">
    <a href="/room/user/SALA-BINGO-42" style="text-decoration: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: bold; transition: all 0.2s; background: #00f0ff; color: #000;">👤 Vista Jugador</a>
    <a href="/room/host/SALA-BINGO-42" style="text-decoration: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: bold; transition: all 0.2s; background: #334155; color: #fff;">👑 Vista Host/Admin</a>
  </div>
</div>
`;

// Ruta inteligente para unirse por enlace o escaneo de QR
app.get('/join/:roomId', (req, res) => {
  const { roomId } = req.params;
  const token = req.cookies && req.cookies.token;
  if (token && token !== 'undefined') {
    // Usuario ya con sesión -> entra directo a la sala
    return res.redirect(`/room/user/${roomId}`);
  }
  // Usuario no logeado -> redirige al login guardando la sala de destino
  res.redirect(`/?redirect=/room/user/${roomId}&roomId=${roomId}&fromQR=1`);
});

// Endpoint API para obtener el QR dinámicamente si se requiere
app.get('/api/qr/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const apiBaseUrl = process.env.API_BASE_URL || `http://${req.get('host')}`;
  const joinUrl = `${apiBaseUrl}/join/${roomId}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(joinUrl, {
      width: 300,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
    res.json({ qr_code: qrDataUrl, join_url: joinUrl });
  } catch (err) {
    res.status(500).json({ error: 'Error generating QR' });
  }
});

// View Routes
app.get('/', (req, res) => {
  res.redirect('/room/user/SALA-BINGO-42');
});

app.get('/room/user/:roomId', (req, res) => {
  res.render('user_room', { id_room: req.params.roomId }, (err, html) => {
    if (err) return res.status(500).send(err.message);
    const modifiedHtml = html.replace('<body class="bg-dark text-light">', '<body class="bg-dark text-light">' + bannerHtml);
    res.send(modifiedHtml);
  });
});

app.get('/room/host/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const apiBaseUrl = process.env.API_BASE_URL || `http://${req.get('host')}`;
  const joinUrl = `${apiBaseUrl}/join/${roomId}`;
  let qrCodeData = '';
  try {
    qrCodeData = await QRCode.toDataURL(joinUrl, {
      width: 300,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  } catch (e) {
    console.error('Error generating QR for host room:', e);
  }

  res.render('host_room', { 
    id_room: roomId,
    api_base_url: apiBaseUrl,
    join_url: joinUrl,
    qr_code: qrCodeData
  }, (err, html) => {
    if (err) return res.status(500).send(err.message);
    const modifiedHtml = html.replace(/<body([^>]*)>/, '<body$1>' + bannerHtml);
    res.send(modifiedHtml);
  });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('Socket conectado:', socket.id);
  socket.on('unirseSala', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('nuevoUsuario', {
      id_room: roomId,
      usuarios: mockUsuarios
    });
  });
});

server.listen(PORT, () => {
  console.log(`Servidor de vista previa listo en http://localhost:${PORT}`);
  console.log(`Sala de Espera (Jugador): http://localhost:${PORT}/room/user/SALA-BINGO-42`);
  console.log(`Sala de Espera (Host): http://localhost:${PORT}/room/host/SALA-BINGO-42`);
});
