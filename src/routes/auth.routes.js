const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { protectUser, requireAdmin } = require('../middlewares/auth');

router.post('/register', ctrl.register);   // POST /api/auth/register
router.post('/login', ctrl.login);         // POST /api/auth/login
router.get('/me', protectUser, ctrl.me);   // GET  /api/auth/me

// مثال لاحقاً: راوت أدمن فقط
router.get('/admin/ping', protectUser, requireAdmin, (req, res) => {
  res.json({ success: true, message: 'pong (admin)' });
});

module.exports = router;
