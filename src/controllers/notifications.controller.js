// controllers/notifications.controller.js
const { Op } = require('sequelize');
const { Notification, NotificationRecipient } = require('../models');

// helper: يبني شروط البحث/الفلترة
function buildQuery({ filter = 'all', q = '' }) {
  const recipientWhere = { deleted: false };
  const notifWhere = {};

  if (filter === 'unread') recipientWhere.read = false;
  if (['system', 'course', 'exam', 'payment'].includes(filter)) {
    notifWhere.type = filter;
  }
  if (q && String(q).trim()) {
    const like = { [Op.like]: `%${String(q).trim()}%` };
    notifWhere[Op.or] = [{ title: like }, { message: like }];
  }

  return { recipientWhere, notifWhere };
}


module.exports = {
  // GET /api/notifications
  list: async (req, res, next) => {
    try {
      const studentId = req.student.id; // من protectStudent
      const { filter = 'all', q = '', page = 1, pageSize = 8 } = req.query;

      const p = Math.max(parseInt(page) || 1, 1);
      const size = Math.min(Math.max(parseInt(pageSize) || 8, 1), 50);

      const { recipientWhere, notifWhere } = buildQuery({ filter, q });
      recipientWhere.student_id = studentId;

      const { rows, count } = await NotificationRecipient.findAndCountAll({
        where: recipientWhere,
        include: [
          { model: Notification, as: 'notification', where: notifWhere, required: true },
        ],
        order: [['created_at', 'DESC']],
        limit: size,
        offset: (p - 1) * size,
      });

      const items = rows.map((row) => {
        const n = row.notification;
        return {
          id: row.id, // recipientId — هويّة العنصر في الفرونت
          type: n.type,
          title: n.title,
          message: n.message,
          dateISO: n.createdAt.toISOString(),
          read: row.read,
          actionLink: n.action_link || null,
        };
      });

      return res.json({
        items,
        total: count,
        page: p,
        pageSize: size,
        totalPages: Math.max(1, Math.ceil(count / size)),
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/notifications/:recipientId/read
  setRead: async (req, res, next) => {
    try {
      const studentId = req.student.id;
      const { recipientId } = req.params;
      const { read } = req.body;

      const row = await NotificationRecipient.findOne({
        where: { id: recipientId, student_id: studentId, deleted: false },
      });
      if (!row) return res.status(404).json({ success: false, message: 'Not found' });

      row.read = !!read;
      row.read_at = read ? new Date() : null;
      await row.save();

      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/notifications/mark-all-read/all
  markAllRead: async (req, res, next) => {
    try {
      const studentId = req.student.id;
      await NotificationRecipient.update(
        { read: true, read_at: new Date() },
        { where: { student_id: studentId, deleted: false, read: false } }
      );
      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/notifications/read (حذف كل المقروء - soft delete)
  clearRead: async (req, res, next) => {
    try {
      const studentId = req.student.id;
      await NotificationRecipient.update(
        { deleted: true },
        { where: { student_id: studentId, read: true, deleted: false } }
      );
      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/notifications/:recipientId (حذف عنصر واحد - soft delete)
  removeOne: async (req, res, next) => {
    try {
      const studentId = req.student.id;
      const { recipientId } = req.params;

      const row = await NotificationRecipient.findOne({
        where: { id: recipientId, student_id: studentId, deleted: false },
      });
      if (!row) return res.status(404).json({ success: false, message: 'Not found' });

      row.deleted = true;
      await row.save();

      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

unreadCount: async (req, res, next) => {
  try {
    const studentId = req.student.id;
    const count = await NotificationRecipient.count({
      where: { student_id: studentId, read: false, deleted: false }, // ← هنا التعديل
    });
    // خليه نفس الشكل المتوقع في الفرونت
    return res.json({ count });
  } catch (e) {
    // خلّيها تمر على error handler عشان تشوف الستاك في اللوجز
    return next(e);
  }
}
};
