const router = require('express').Router();
const { courseProgress, updateLesson } = require('../controllers/progress.controller');
const { protectStudent } = require('../middlewares/auth');

router.get('/courses/:id', protectStudent, courseProgress);          // GET  /api/progress/courses/:id
router.patch('/lessons/:lessonId', protectStudent, updateLesson);    // PATCH /api/progress/lessons/:lessonId

module.exports = router;
