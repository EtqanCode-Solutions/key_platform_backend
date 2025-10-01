// controllers/progress.controller.js
const asyncHandler = require('express-async-handler');
const { Sequelize, Op } = require('sequelize'); // ✅ أضفنا Op
const {
  Course,
  Lesson,
  Enrollment,
  LessonProgress,
  Notification,
  NotificationRecipient,
} = require('../models');
const { _issueCourseIfNotExists } = require('./cert.controller'); // ✅ استدعاء الهيلبر

const secToHHMMSS = (sec = 0) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

// GET /api/courses/:id/progress
exports.courseProgress = asyncHandler(async (req, res) => {
  const studentId = req.student.id;
  const { id } = req.params;

  const en = await Enrollment.findOne({
    where: { student_id: studentId, course_id: id, status: 'active' },
  });
  if (!en) return res.status(403).json({ success: false, message: 'Enroll required' });

  const course = await Course.findByPk(id);
  if (!course || !course.is_active)
    return res.status(404).json({ success: false, message: 'Course not found' });

  const lessons = await Lesson.findAll({
    where: { course_id: id, is_active: true },
    order: [['order', 'ASC']],
  });

  const progresses = await LessonProgress.findAll({
    where: { student_id: studentId, lesson_id: lessons.map((l) => l.id) },
  });
  const map = new Map(progresses.map((p) => [p.lesson_id, p]));

  const outLessons = lessons.map((l, idx) => {
    const p = map.get(l.id);
    const watched = p?.watchedSec || 0;
    const total = l.durationSec || 0;

    // منطق قفل بسيط
    let status = 'completed';
    if (!p?.completed) {
      status = watched > 0 ? 'in-progress' : idx === 0 ? 'in-progress' : 'locked';
    }

    return {
      id: l.id,
      title: l.title,
      duration: secToHHMMSS(total),
      status,
      watchedSec: watched,
      totalSec: total,
      videoUrl: l.videoUrl,
    };
  });

  const total = lessons.reduce((a, l) => a + (l.durationSec || 0), 0);
  const watched = progresses.reduce((a, p) => a + (p.watchedSec || 0), 0);
  const completedCount = outLessons.filter((x) => x.status === 'completed').length;

  const resp = {
    course: {
      id: course.id,
      title: course.title,
      teacher: course.teacher || 'Instructor',
      lessons: lessons.length,
      completed: completedCount,
      duration: secToHHMMSS(total),
      estimatedTimeLeft: secToHHMMSS(Math.max(0, total - watched)),
      progress: total ? watched / total : 0,
    },
    lessons: outLessons,
  };

  res.json({ success: true, data: resp });
});

// PATCH /api/progress/lessons/:lessonId
// body: { watchedSec: number, completed?: boolean }
exports.updateLesson = asyncHandler(async (req, res) => {
  const studentId = req.student.id;
  const { lessonId } = req.params;
  const { watchedSec, completed } = req.body;

  const lesson = await Lesson.findByPk(lessonId, {
    include: [{ model: Course, as: 'course' }],
  });
  if (!lesson || !lesson.is_active || !lesson.course?.is_active) {
    return res.status(404).json({ success: false, message: 'Lesson not found' });
  }

  // تحقق من الالتحاق
  const en = await Enrollment.findOne({
    where: { student_id: studentId, course_id: lesson.course_id, status: 'active' },
  });
  if (!en) return res.status(403).json({ success: false, message: 'Enroll required' });

  const [prog] = await LessonProgress.findOrCreate({
    where: { student_id: studentId, lesson_id: lesson.id },
    defaults: { watchedSec: 0, completed: false, lastWatchedAt: new Date() },
  });

  if (typeof watchedSec === 'number') {
    prog.watchedSec = Math.max(prog.watchedSec, watchedSec);
  }
  if (typeof completed === 'boolean') {
    prog.completed = completed;
  }
  prog.lastWatchedAt = new Date();
  await prog.save();

  // === لو كل دروس الكورس مكتملة → إصدار الشهادة (لو غير موجودة) + إشعار
  const allLessons = await Lesson.findAll({
    where: { course_id: lesson.course_id, is_active: true },
    attributes: ['id'],
  });
  const ids = allLessons.map((l) => l.id);

  const doneCount = await LessonProgress.count({
    where: { student_id: studentId, lesson_id: { [Op.in]: ids }, completed: true },
  });

  let justIssuedCertificate = null;

  if (ids.length > 0 && doneCount === ids.length) {
    const { created, cert } = await _issueCourseIfNotExists({
      studentId,
      course: lesson.course,
    });

    if (created) {
      // إشعار الشهادة
      const note = await Notification.create({
        type: 'course',
        title: 'Certificate issued',
        message: `Your certificate for "${lesson.course.title}" is ready.`,
        action_link: '/app/certificates',
      });
      await NotificationRecipient.create({
        notification_id: note.id,
        student_id: studentId,
        read: false,
        deleted: false,
      });

      justIssuedCertificate = { id: cert.id, verifyCode: cert.verifyCode };
    }
  }

  res.json({
    success: true,
    message: 'Progress updated',
    data: {
      lesson_id: lesson.id,
      watchedSec: prog.watchedSec,
      completed: prog.completed,
      justIssuedCertificate, // null أو { id, verifyCode }
    },
  });
});
