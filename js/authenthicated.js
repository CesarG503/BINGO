const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  let token;
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    if (req.originalUrl && (req.originalUrl.startsWith('/room/user/') || req.originalUrl.startsWith('/join/'))) {
      return res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}&fromQR=1`);
    }
    return res.redirect("/");
  }

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) { 
      if (err.name === 'TokenExpiredError') {
        res.clearCookie('token'); // Elimina la cookie del token
      }
      if (req.originalUrl && (req.originalUrl.startsWith('/room/user/') || req.originalUrl.startsWith('/join/'))) {
        return res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}&expired=1`);
      }
      return res.redirect('/');
    }
    req.user = user;
    next();
  });
};

function validateRole(role) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.sendStatus(401);
    }
    if (user.rol === role) {
      next();
    } else {
      res.redirect('/');
    }
  };
}

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return;
      }
      return;
    }
    socket.user = user;
    next();
  });
}

module.exports = { authenticateToken, validateRole, authenticateSocket };
