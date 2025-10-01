const router = require('express').Router();
const { getOne } = require('../controllers/lesson.controller');
const { protectStudent } = require('../middlewares/auth');

router.get('/:lessonId', protectStudent, getOne); // GET /api/lessons/:lessonId

module.exports = router;
