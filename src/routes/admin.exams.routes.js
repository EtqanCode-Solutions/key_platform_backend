// routes/admin.exams.routes.js
const router = require('express').Router();
const adminSecret = require('../middlewares/adminSecret');
const AdminExams = require('../controllers/admin.exams.controller');

router.use(adminSecret);

router.post('/', AdminExams.createExam);                // POST /api/admin/exams
router.patch('/:examId', AdminExams.updateExam);        // PATCH /api/admin/exams/:examId
router.patch('/:examId/publish', AdminExams.publish);   // PATCH /api/admin/exams/:examId/publish
router.patch('/:examId/unpublish', AdminExams.unpublish); // PATCH /api/admin/exams/:examId/unpublish
router.post('/:examId/questions/bulk', AdminExams.addQuestions);
router.get('/', AdminExams.listExams);            // GET    /api/admin/exams
router.get('/:examId', AdminExams.getExamById); // POST /api/admin/exams/:examId/questions/bulk

module.exports = router;
