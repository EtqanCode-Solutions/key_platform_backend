const asyncHandler = require('express-async-handler');
const { Lesson, Course, Enrollment } = require('../models');

const secToHHMM = (sec=0) => {
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

// GET /api/lessons/:lessonId
exports.getOne = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const studentId = req.student.id;

  const lesson = await Lesson.findByPk(lessonId, {
    include: [{ model: Course, as: 'course', attributes: ['id','title','is_active'] }]
  });

  if (!lesson || !lesson.is_active || !lesson.course?.is_active) {
    return res.status(404).json({ success: false, message: 'Lesson not found' });
  }

  // لو مش مجاني، لازم يكون ملتحق بالكورس
  if (!lesson.is_free) {
    const en = await Enrollment.findOne({ where: { student_id: studentId, course_id: lesson.course_id, status: 'active' } });
    if (!en) return res.status(403).json({ success: false, message: 'Enroll required' });
  }

  res.json({
    success: true,
    data: {
      id: lesson.id,
      title: lesson.title,
      duration: secToHHMM(lesson.durationSec || 0),
      videoUrl: lesson.videoUrl,
      course: { id: lesson.course.id, title: lesson.course.title }
    }
  });
});
