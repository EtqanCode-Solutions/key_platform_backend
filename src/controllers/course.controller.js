const asyncHandler = require('express-async-handler');
const { Sequelize } = require('sequelize');
const { Course, Lesson, Enrollment } = require('../models');

// util
const secToHHMM = (sec=0) => {
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

// GET /api/courses
exports.list = asyncHandler(async (req, res) => {
  const studentId = req.student?.id;

  const courses = await Course.findAll({
    where: { is_active: true },
    order: [['id', 'DESC']],
    attributes: [
      'id','title','teacher','rating','review_count','coverUrl','price','original_price','is_free',
      'previewUrl','total_duration_sec',
      [Sequelize.literal(`(SELECT COUNT(*) FROM lessons WHERE lessons.course_id = Course.id AND lessons.is_active = 1)`), 'lessonsCount']
    ]
  });

  let enrolledIds = new Set();
  if (studentId) {
    const ens = await Enrollment.findAll({ where: { student_id: studentId, status: 'active' }, attributes: ['course_id'] });
    enrolledIds = new Set(ens.map(e => e.course_id));
  }

  const data = courses.map(c => {
    const json = c.toJSON();
    return {
      id: json.id,
      title: json.title,
      teacher: json.teacher || 'Instructor',
      rating: Number(json.rating || 0),
      reviewCount: json.review_count || 0,
      lessons: Number(json.lessonsCount || 0),
      duration: secToHHMM(json.total_duration_sec || 0),
      price: json.price ? Number(json.price) : undefined,
      originalPrice: json.original_price ? Number(json.original_price) : undefined,
      free: !!json.is_free,
      coverUrl: json.coverUrl || null,
      previewUrl: json.previewUrl || null,
      isEnrolled: enrolledIds.has(json.id)
    };
  });

  res.json({ success: true, data });
});

// GET /api/courses/:id
exports.details = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.student?.id;

  const course = await Course.findByPk(id, {
    attributes: ['id','title','subtitle','teacher','description','coverUrl','previewUrl','price','original_price','is_free','rating','review_count','total_duration_sec','is_active'],
    include: [{
      model: Lesson,
      as: 'lessons',
      required: false,
      where: { is_active: true },
      attributes: ['id','title','order','is_free','durationSec'],
      order: [['order','ASC']]
    }]
  });

  if (!course || !course.is_active) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  let isEnrolled = false;
  if (studentId) {
    const en = await Enrollment.findOne({ where: { student_id: studentId, course_id: id, status: 'active' } });
    isEnrolled = !!en;
  }

  const json = course.toJSON();
  const lessons = (json.lessons || []).sort((a,b)=>a.order-b.order).map(l => ({
    id: l.id,
    title: l.title,
    duration: secToHHMM(l.durationSec || 0),
    free: !!l.is_free,
  }));

  res.json({
    success: true,
    data: {
      id: json.id,
      title: json.title,
      subtitle: json.subtitle,
      teacher: json.teacher,
      description: json.description,
      coverUrl: json.coverUrl,
      previewUrl: json.previewUrl,
      rating: Number(json.rating || 0),
      reviewCount: json.review_count || 0,
      duration: secToHHMM(json.total_duration_sec || 0),
      price: json.price ? Number(json.price) : undefined,
      originalPrice: json.original_price ? Number(json.original_price) : undefined,
      free: !!json.is_free,
      isEnrolled,
      lessons
    }
  });
});

// POST /api/courses/:id/enroll
exports.enroll = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.student.id;

  const course = await Course.findByPk(id);
  if (!course || !course.is_active) return res.status(404).json({ success: false, message: 'Course not found' });

  const [enrollment, created] = await Enrollment.findOrCreate({
    where: { student_id: studentId, course_id: id },
    defaults: { status: 'active', started_at: new Date() }
  });

  if (!created && enrollment.status !== 'active') {
    enrollment.status = 'active';
    enrollment.started_at = new Date();
    enrollment.expires_at = null;
    await enrollment.save();
  }

  res.status(created ? 201 : 200).json({ success: true, message: 'Enrolled', data: enrollment });
});
