const router = require('express').Router();
const { list, details, enroll } = require('../controllers/course.controller');
const { protectStudent } = require('../middlewares/auth');

router.get('/', protectStudent, list);         // GET  /api/courses
router.get('/:id', protectStudent, details);   // GET  /api/courses/:id
router.post('/:id/enroll', protectStudent, enroll); // POST /api/courses/:id/enroll

module.exports = router;
