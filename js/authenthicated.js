const jwt = require('jsonwebtoken');

const getLoginRedirectUrl = (req) => {
  const targetUrl = req.originalUrl || req.url;
  if (targetUrl && typeof targetUrl === 'string') {
    if (
      targetUrl.startsWith('/') &&
      !targetUrl.startsWith('//') &&
      !targetUrl.startsWith('/\\') &&
      !targetUrl.startsWith('/ ') &&
      !/[\r\n]/.test(targetUrl)
    ) {
      if (targetUrl.startsWith('/join/') || targetUrl.startsWith('/room/')) {
        return `/?redirect=${encodeURIComponent(targetUrl)}`;
      }
    }
  }
  return '/';
};

const authenticateToken = (req, res, next) => {
  let token;
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) return res.redirect(getLoginRedirectUrl(req));

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) { 
      if (err.name === 'TokenExpiredError') {
        res.clearCookie('token'); // Elimina la cookie del token
        return res.redirect(getLoginRedirectUrl(req)); // Redirige al login
      }
      res.clearCookie('token');
      return res.redirect(getLoginRedirectUrl(req));
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
