// routes/notifications.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/notifications.controller');
const { protectStudent } = require('../middlewares/auth');

router.get('/', protectStudent, ctrl.list);
router.get('/unread-count', protectStudent, ctrl.unreadCount);
router.patch('/:recipientId/read', protectStudent, ctrl.setRead);
router.patch('/mark-all-read/all', protectStudent, ctrl.markAllRead);
router.delete('/read', protectStudent, ctrl.clearRead);
router.delete('/:recipientId', protectStudent, ctrl.removeOne);

module.exports = router;
