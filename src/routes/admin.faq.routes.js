// routes/admin.faq.routes.js
const router = require('express').Router();
const adminSecret = require('../middlewares/adminSecret');
const ctrl = require('../controllers/admin.faq.controller');

router.use(adminSecret);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
