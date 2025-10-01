// routes/students.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/student.controller');
const { protectStudent } = require('../middlewares/auth');
const adminSecret = require('../middlewares/adminSecret');

/* ===== Auth (عام) ===== */
router.post('/register', ctrl.register);  // POST /api/students/register
router.post('/login', ctrl.login);        // POST /api/students/login

/* ===== الطالب لنفسه ===== */
router.get('/me',    protectStudent, ctrl.me);        // GET    /api/students/me
router.patch('/me',  protectStudent, ctrl.updateMe);  // PATCH  /api/students/me
router.delete('/me', protectStudent, ctrl.deleteMe);  // DELETE /api/students/me

/* ===== أدمن فقط ===== */
router.get('/',    adminSecret, ctrl.list);       // GET    /api/students/
router.get('/:id', adminSecret, ctrl.getById);    // GET    /api/students/:id
router.patch('/:id', adminSecret, ctrl.adminUpdate); // PATCH  /api/students/:id
router.delete('/:id', adminSecret, ctrl.adminDelete); // DELETE /api/students/:id

module.exports = router;
