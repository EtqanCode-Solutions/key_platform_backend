// routes/admin.support.routes.js
const router = require('express').Router();
const adminSecret = require('../middlewares/adminSecret'); // تأكد من المسار الصحيح
const ctrl = require('../controllers/admin.support.controller');

// حماية كل مسار بهذه الـ secret
router.use(adminSecret);

router.get('/tickets', ctrl.listAll);
router.get('/tickets/:id', ctrl.getOne);
router.patch('/tickets/:id/assign', ctrl.assign);
router.patch('/tickets/:id/status', ctrl.setStatus);
router.post('/tickets/:id/messages', ctrl.reply);

module.exports = router;
