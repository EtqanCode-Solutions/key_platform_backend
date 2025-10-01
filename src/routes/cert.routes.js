const router = require('express').Router();
const ctrl = require('../controllers/cert.controller');
const { protectStudent } = require('../middlewares/auth');
const adminSecret = require('../middlewares/adminSecret');

// Student endpoints
router.get('/', protectStudent, ctrl.list);
router.get('/verify/:code', ctrl.verify);
router.post('/issue/course/:courseId', protectStudent, ctrl.issueForCourse);

// Admin-only endpoints (protected by adminSecret)
router.get('/getAllCertificates', adminSecret, ctrl.getAllCertificates);
router.patch('/updateCertificate/:id', adminSecret, ctrl.updateCertificate);
router.delete('/deleteCertificate/:id', adminSecret, ctrl.deleteCertificate);

module.exports = router;
