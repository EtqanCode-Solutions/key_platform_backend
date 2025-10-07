// routes/admin.exams.routes.js
const router = require('express').Router();
const adminSecret = require('../middlewares/adminSecret');
const AdminExams = require('../controllers/admin.exams.controller');

router.use(adminSecret);

router.post('/', AdminExams.createExam);
router.patch('/:examId', AdminExams.updateExam);
router.patch('/:examId/publish', AdminExams.publish);
router.patch('/:examId/unpublish', AdminExams.unpublish);

// إضافة فقط (قديمة)
router.post('/:examId/questions/bulk', AdminExams.addQuestions);

// مزامنة/تعديل شامل (جديد)
router.patch('/:examId/questions/bulk', AdminExams.syncQuestions);

router.get('/', AdminExams.listExams);
router.get('/:examId', AdminExams.getExamById);

module.exports = router;