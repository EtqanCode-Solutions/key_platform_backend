// routes/exams.routes.js
const router = require('express').Router();
const Exams = require('../controllers/exams.controller');
const { protectUser, protectStudent, requireAdmin } = require('../middlewares/auth');

router.get('/', Exams.list);
router.get('/attempts/:attemptId', Exams.getAttempt);
router.get('/history/me', protectStudent, Exams.historyMe);
router.get('/history/:studentId', protectUser, requireAdmin, Exams.historyByStudent);
router.post('/:slug/attempts', protectStudent, Exams.submitAttempt);
router.get('/:slug', Exams.getBySlug);

module.exports = router;
