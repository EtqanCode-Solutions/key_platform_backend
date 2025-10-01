const jwt = require('jsonwebtoken');

const readBearer = (req) => {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
};

module.exports = {
  protectUser: (req, res, next) => {
    try {
      const token = readBearer(req);
      if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload || !payload.type || payload.type !== 'user') {
        return res.status(401).json({ success: false, message: 'Invalid token (user)' });
      }
      req.user = payload; // { id, email, role, type:'user' }
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  },

  protectStudent: (req, res, next) => {
    try {
      const token = readBearer(req);
      if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload || !payload.type || payload.type !== 'student') {
        return res.status(401).json({ success: false, message: 'Invalid token (student)' });
      }
      req.student = payload; // { id, type:'student' }
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  },

  requireAdmin: (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    next();
  }
};
