// routes/faq.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/faq.controller');

router.get('/', ctrl.listPublic);

module.exports = router;
