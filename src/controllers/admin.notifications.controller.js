// controllers/admin.notifications.controller.js
const { Sequelize } = require('sequelize');
const { Notification, NotificationRecipient, Student, sequelize } = require('../models');

module.exports = {
  // POST /api/admin/notifications
  // body: { type, title, message, actionLink?, target: 'all'|'students', studentIds?: number[] }
  createAndSend: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const {
        type = 'system',
        title,
        message,
        actionLink = null,
        target = 'all',
        studentIds = [],
      } = req.body;

      if (!title || !message) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'title and message are required' });
      }
      if (!['system', 'course', 'exam', 'payment'].includes(type)) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Invalid type' });
      }

      let recipients = [];
      if (target === 'all') {
        recipients = await Student.findAll({ where: { is_active: true }, attributes: ['id'], transaction: t });
      } else if (target === 'students') {
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
          await t.rollback();
          return res.status(400).json({ success: false, message: 'studentIds required when target=students' });
        }
        recipients = await Student.findAll({ where: { id: studentIds }, attributes: ['id'], transaction: t });
      } else {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Invalid target' });
      }

      const notif = await Notification.create(
        { type, title, message, action_link: actionLink },
        { transaction: t }
      );

      if (recipients.length) {
        const rows = recipients.map((s) => ({
          notification_id: notif.id,
          student_id: s.id,
          read: false,
          read_at: null,
          deleted: false,
        }));
        await NotificationRecipient.bulkCreate(rows, { transaction: t });
      }

      await t.commit();
      return res.status(201).json({ success: true, id: notif.id, recipients: recipients.length });
    } catch (err) {
      await t.rollback();
      next(err);
    }
  },

  // PATCH /api/admin/notifications/:notificationId
  // body: { type?, title?, message?, actionLink? }
  updateNotification: async (req, res, next) => {
    try {
      const { notificationId } = req.params;
      const { type, title, message, actionLink } = req.body;

      const notif = await Notification.findByPk(notificationId);
      if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

      if (type && !['system', 'course', 'exam', 'payment'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid type' });
      }

      if (type !== undefined) notif.type = type;
      if (title !== undefined) notif.title = title;
      if (message !== undefined) notif.message = message;
      if (actionLink !== undefined) notif.action_link = actionLink;

      await notif.save();
      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/admin/notifications/:notificationId
  // حذف الإشعار عالميًا (ويمسح روابطه)
  removeNotification: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { notificationId } = req.params;
      const notif = await Notification.findByPk(notificationId, { transaction: t });
      if (!notif) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      await NotificationRecipient.destroy({ where: { notification_id: notificationId }, transaction: t });
      await notif.destroy({ transaction: t });

      await t.commit();
      return res.json({ success: true });
    } catch (err) {
      await t.rollback();
      next(err);
    }
  },

  // POST /api/admin/notifications/:notificationId/send
  // body: { target: 'all'|'students', studentIds?: number[] }
  // يعيد استخدام إشعار موجود ويرسله الآن إلى جمهور جديد
  sendExisting: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { notificationId } = req.params;
      const { target = 'all', studentIds = [] } = req.body;

      const notif = await Notification.findByPk(notificationId, { transaction: t });
      if (!notif) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      let recipients = [];
      if (target === 'all') {
        recipients = await Student.findAll({ where: { is_active: true }, attributes: ['id'], transaction: t });
      } else if (target === 'students') {
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
          await t.rollback();
          return res.status(400).json({ success: false, message: 'studentIds required when target=students' });
        }
        recipients = await Student.findAll({ where: { id: studentIds }, attributes: ['id'], transaction: t });
      } else {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Invalid target' });
      }

      if (recipients.length) {
        // تلافي الازدواج: لا تنشئ صفًا لمن لديه نفس notification_id مسبقًا ولم يُحذف
        const values = recipients.map((s) => `(${notif.id},${s.id},0,NULL,0, NOW(), NOW())`).join(',');
        const sql = `
          INSERT INTO notification_recipients
            (notification_id, student_id, read, read_at, deleted, created_at, updated_at)
          VALUES ${values}
          ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)
        `;
        await sequelize.query(sql, { transaction: t });
      }

      await t.commit();
      return res.json({ success: true, recipients: recipients.length });
    } catch (err) {
      await t.rollback();
      next(err);
    }
  },

  // DELETE /api/admin/notifications/:notificationId/recipients/:studentId
  // إزالة إشعار لطالب محدد (soft delete)
  removeForStudent: async (req, res, next) => {
    try {
      const { notificationId, studentId } = req.params;
      const row = await NotificationRecipient.findOne({
        where: { notification_id: notificationId, student_id: studentId, deleted: false },
      });
      if (!row) return res.status(404).json({ success: false, message: 'Recipient not found' });
      row.deleted = true;
      await row.save();
      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
