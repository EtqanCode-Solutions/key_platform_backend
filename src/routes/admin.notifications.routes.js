// routes/admin.notifications.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/admin.notifications.controller');
const adminSecret = require('../middlewares/adminSecret'); // ← بتاعك

// إنشاء + إرسال فورًا
router.post('/', adminSecret, ctrl.createAndSend);

// تعديل إشعار
router.patch('/:notificationId', adminSecret, ctrl.updateNotification);

// حذف إشعار كليًا
router.delete('/:notificationId', adminSecret, ctrl.removeNotification);

// إعادة إرسال إشعار موجود
router.post('/:notificationId/send', adminSecret, ctrl.sendExisting);

// إزالة إشعار لطالب محدد (soft delete)
router.delete('/:notificationId/recipients/:studentId', adminSecret, ctrl.removeForStudent);

router.get('/', adminSecret, ctrl.list);
router.get('/:notificationId', adminSecret, ctrl.getOne);

module.exports = router;
