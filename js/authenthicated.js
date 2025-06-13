import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  let token;
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err){ 
      if (err.name === 'TokenExpiredError') {
        // Borra la cookie si el token ha expirado
        res.clearCookie('token', { path: '/' });
        return res.redirect('/'); // Redirige al login
      }
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

export const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Authentication error'));
    }
    socket.user = user;
    next();
  });
}