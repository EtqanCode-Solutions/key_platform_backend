// routes/support.routes.js
const router = require('express').Router();
const { protectStudent } = require('../middlewares/auth');
const ctrl = require('../controllers/support.controller');

router.use(protectStudent);

router.post('/tickets', ctrl.createTicket);
router.get('/tickets', ctrl.myTickets);
router.get('/tickets/:id', ctrl.getTicket);
router.post('/tickets/:id/messages', ctrl.addMessage);
router.patch('/tickets/:id/close', ctrl.closeMyTicket);

module.exports = router;
