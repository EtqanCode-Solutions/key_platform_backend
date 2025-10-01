// controllers/cert.controller.js
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { Certificate, Student, Course, Lesson, Notification, NotificationRecipient } = require('../models');

/** مولّد كود تحقق بسيط ومقروء */
function genVerifyCode(prefix = 'ETQ-CRS') {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const rand2 = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${rand}${rand2}`;
}

const secToHours1 = (sec = 0) => {
  const h = Number(sec || 0) / 3600;
  return Math.round(h * 10) / 10; // رقم عشري واحد
};

// GET /api/certificates
exports.list = asyncHandler(async (req, res) => {
  const studentId = req.student.id;

  const certs = await Certificate.findAll({
    where: { student_id: studentId },
    order: [['issuedAt', 'DESC']],
  });

  const student = await Student.findByPk(studentId, { attributes: ['id', 'name'] });

  const data = certs.map((c) => ({
    id: c.id,
    kind: c.kind,
    title: c.title,
    recipient: student?.name || 'Student Name', // اسم الطالب الحالي
    issuedAt: c.issuedAt,
    provider: c.provider || 'مفتاح اللفظي',
    scorePct: c.scorePct ?? undefined,
    grade: c.grade ?? undefined,
    hours: c.hours ?? undefined,
    verifyCode: c.verifyCode,
    theme: c.theme,
  }));

  res.json({ success: true, data });
});

// GET /api/certificates/verify/:code
exports.verify = asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').trim();
  if (!code) return res.status(400).json({ success: false, message: 'Code is required' });

  const row = await Certificate.findOne({ where: { verifyCode: code } });
  if (!row) return res.status(404).json({ success: false, message: 'Certificate not found' });

  const student = await Student.findByPk(row.student_id, { attributes: ['id', 'name'] });

  return res.json({
    success: true,
    data: {
      code: row.verifyCode,
      kind: row.kind,
      title: row.title,
      issuedAt: row.issuedAt,
      provider: row.provider || 'مفتاح اللفظي',
      scorePct: row.scorePct ?? undefined,
      grade: row.grade ?? undefined,
      hours: row.hours ?? undefined,
      student: student ? { id: student.id, name: student.name } : null,
      theme: row.theme,
    },
  });
});

// POST /api/certificates/issue/course/:courseId
// إصدار يدوي إن لزم + إرسال إشعار
exports.issueForCourse = asyncHandler(async (req, res) => {
  const studentId = req.student.id;
  const courseId = parseInt(req.params.courseId, 10);

  const course = await Course.findByPk(courseId);
  if (!course || !course.is_active) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // لو موجودة بالفعل
  const existing = await Certificate.findOne({
    where: { student_id: studentId, kind: 'course', title: course.title },
  });
  if (existing) {
    return res.json({
      success: true,
      already: true,
      certId: existing.id,
      verifyCode: existing.verifyCode,
    });
  }

  // حساب ساعات التدريب من مجموع مدّة الدروس
  const lessons = await Lesson.findAll({ where: { course_id: courseId, is_active: true } });
  const totalSec = lessons.reduce((a, l) => a + (l.durationSec || 0), 0);

  const cert = await Certificate.create({
    id: `c_${studentId}_${courseId}_${Date.now()}`,
    student_id: studentId,
    kind: 'course',
    title: course.title,
    issuedAt: new Date().toISOString().slice(0, 10),
    provider: 'Miftah Al-Lafzi Platform',
    hours: secToHours1(totalSec),
    verifyCode: genVerifyCode('ETQ-CRS'),
    theme: 'classic',
  });

  // إشعار
  const note = await Notification.create({
    type: 'course',
    title: 'Certificate issued',
    message: `Your certificate for "${course.title}" is ready.`,
    action_link: '/app/certificates',
  });
  await NotificationRecipient.create({
    notification_id: note.id,
    student_id: studentId,
    read: false,
    deleted: false,
  });

  return res.status(201).json({ success: true, certId: cert.id, verifyCode: cert.verifyCode });
});

// مُستخدم داخليًا من progress.controller لإصدار الشهادة مرة واحدة فقط
exports._issueCourseIfNotExists = async ({ studentId, course }) => {
  const existed = await Certificate.findOne({
    where: { student_id: studentId, kind: 'course', title: course.title },
  });
  if (existed) return { created: false, cert: existed };

  const lessons = await Lesson.findAll({ where: { course_id: course.id, is_active: true } });
  const totalSec = lessons.reduce((a, l) => a + (l.durationSec || 0), 0);

  const cert = await Certificate.create({
    id: `c_${studentId}_${course.id}_${Date.now()}`,
    student_id: studentId,
    kind: 'course',
    title: course.title,
    issuedAt: new Date().toISOString().slice(0, 10),
    provider: 'Miftah Al-Lafzi Platform',
    hours: secToHours1(totalSec),
    verifyCode: genVerifyCode('ETQ-CRS'),
    theme: 'classic',
  });

  return { created: true, cert };
};

// Admin: GET /api/certificates/getAllCertificates
exports.getAllCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.findAll({ order: [['issuedAt', 'DESC']] });

  const studentIds = [...new Set(certs.map((c) => c.student_id))];
  const students = await Student.findAll({
    where: { id: { [Op.in]: studentIds } },
    attributes: ['id', 'name'],
  });
  const studentMap = {};
  students.forEach((s) => {
    studentMap[s.id] = s.name;
  });
  const data = certs.map((c) => ({
    id: c.id,
    kind: c.kind,
    title: c.title,
    recipient: studentMap[c.student_id] || 'Student Name',
    issuedAt: c.issuedAt,
    provider: c.provider || 'مفتاح اللفظي',
    scorePct: c.scorePct ?? undefined,
    grade: c.grade ?? undefined,
    hours: c.hours ?? undefined,
    verifyCode: c.verifyCode,
    theme: c.theme,
  }));
  res.json({ success: true, data });
});

// Admin: PATCH /api/certificates/updateCertificate/:id
exports.updateCertificate = asyncHandler(async (req, res) => {
  const certId = req.params.id;
  const { title, issuedAt, provider, hours, theme } = req.body;
  const cert = await Certificate.findByPk(certId);
  if (!cert) {
    return res.status(404).json({ success: false, message: 'Certificate not found' });
  }
  cert.title = title || cert.title;
  cert.issuedAt = issuedAt || cert.issuedAt;
  cert.provider = provider || cert.provider;
  cert.hours = hours !== undefined ? hours : cert.hours;
  cert.theme = theme || cert.theme;
  await cert.save();
  res.json({ success: true, message: 'Certificate updated' });
});


// Admin: DELETE /api/certificates/deleteCertificate/:id
exports.deleteCertificate = asyncHandler(async (req, res) => {
  const certId = req.params.id; 
  const cert = await Certificate.findByPk(certId);
  if (!cert) {
    return res.status(404).json({ success: false, message: 'Certificate not found' });
  }
  await cert.destroy();
  res.json({ success: true, message: 'Certificate deleted' });
});
