const router = require('express').Router();
const adminSecret = require('../middlewares/adminSecret');
const Courses = require('../controllers/admin.courses.controller');

router.use(adminSecret);

// Courses
router.get('/courses', Courses.getAllCourses);
router.get('/courses/:id', Courses.getCourseById);
router.post('/courses', Courses.createCourse);
router.patch('/courses/:id', Courses.updateCourse);
router.patch('/courses/:id/publish', Courses.publishCourse);

// Lessons
router.get('/courses/:id/lessons', Courses.getLessonsByCourseId);
router.post('/courses/:id/lessons', Courses.addLesson);
router.patch('/lessons/:lessonId', Courses.updateLesson);
router.delete('/lessons/:lessonId', Courses.deleteLesson);

module.exports = router;
