const asyncHandler = require('express-async-handler');
const { Course, Lesson } = require('../models');

// ===== Courses =====

// GET /api/admin/courses
exports.getAllCourses = asyncHandler(async (req, res) => {
  const courses = await Course.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ success: true, data: courses });
});

// GET /api/admin/courses/:id
exports.getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await Course.findByPk(id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, data: course });
});


// POST /api/admin/courses
exports.createCourse = asyncHandler(async (req, res) => {
  const p = req.body;
  if (!p.title) return res.status(400).json({ success: false, message: 'title is required' });

  const course = await Course.create({
    title: p.title,
    subtitle: p.subtitle,
    teacher: p.teacher,
    description: p.description,
    coverUrl: p.coverUrl,
    previewUrl: p.previewUrl,
    price: p.price,
    original_price: p.originalPrice,
    is_free: !!p.free,
    rating: p.rating ?? 0,
    review_count: p.reviewCount ?? 0,
    total_duration_sec: p.totalDurationSec ?? 0,
    is_active: p.isActive ?? true,
  });

  res.status(201).json({ success: true, data: { id: course.id } });
});

// PATCH /api/admin/courses/:id
exports.updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const p = req.body;
  const course = await Course.findByPk(id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  await course.update({
    title: p.title ?? course.title,
    subtitle: p.subtitle ?? course.subtitle,
    teacher: p.teacher ?? course.teacher,
    description: p.description ?? course.description,
    coverUrl: p.coverUrl ?? course.coverUrl,
    previewUrl: p.previewUrl ?? course.previewUrl,
    price: p.price ?? course.price,
    original_price: p.originalPrice ?? course.original_price,
    is_free: typeof p.free === 'boolean' ? p.free : course.is_free,
    rating: p.rating ?? course.rating,
    review_count: p.reviewCount ?? course.review_count,
    total_duration_sec: p.totalDurationSec ?? course.total_duration_sec,
    is_active: typeof p.isActive === 'boolean' ? p.isActive : course.is_active,
  });

  res.json({ success: true, message: 'Course updated' });
});

// PATCH /api/admin/courses/:id/publish  { isActive: true|false }
exports.publishCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const course = await Course.findByPk(id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  course.is_active = !!isActive;
  await course.save();
  res.json({ success: true, message: `Course ${course.is_active ? 'activated' : 'deactivated'}` });
});

// ===== Lessons =====

// GET /api/admin/courses/:id/lessons
exports.getLessonsByCourseId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await Course.findByPk(id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  const lessons = await Lesson.findAll({ where: { course_id: course.id }, order: [['order', 'ASC'], ['createdAt', 'ASC']] });
  res.json({ success: true, data: lessons });
});


// POST /api/admin/courses/:id/lessons
exports.addLesson = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const p = req.body;

  const course = await Course.findByPk(id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  if (!p.title) return res.status(400).json({ success: false, message: 'title is required' });

  const lesson = await Lesson.create({
    course_id: course.id,
    title: p.title,
    order: p.order ?? 1,
    videoUrl: p.videoUrl,
    durationSec: p.durationSec ?? 0,
    is_free: !!p.free,
    is_active: typeof p.isActive === 'boolean' ? p.isActive : true,
  });

  if (typeof p.durationSec === 'number' && p.durationSec > 0) {
    course.total_duration_sec = (course.total_duration_sec || 0) + p.durationSec;
    await course.save();
  }

  res.status(201).json({ success: true, data: { id: lesson.id } });
});

// PATCH /api/admin/lessons/:lessonId
exports.updateLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const p = req.body;

  const lesson = await Lesson.findByPk(lessonId);
  if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

  const before = lesson.durationSec || 0;

  await lesson.update({
    title: p.title ?? lesson.title,
    order: p.order ?? lesson.order,
    videoUrl: p.videoUrl ?? lesson.videoUrl,
    durationSec: typeof p.durationSec === 'number' ? p.durationSec : lesson.durationSec,
    is_free: typeof p.free === 'boolean' ? p.free : lesson.is_free,
    is_active: typeof p.isActive === 'boolean' ? p.isActive : lesson.is_active,
  });

  if (typeof p.durationSec === 'number') {
    const course = await Course.findByPk(lesson.course_id);
    if (course) {
      course.total_duration_sec = Math.max(0, (course.total_duration_sec || 0) - before + (lesson.durationSec || 0));
      await course.save();
    }
  }

  res.json({ success: true, message: 'Lesson updated' });
});

// DELETE /api/admin/lessons/:lessonId
exports.deleteLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const lesson = await Lesson.findByPk(lessonId);
  if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

  const dur = lesson.durationSec || 0;
  const course = await Course.findByPk(lesson.course_id);

  await lesson.destroy();

  if (course && dur) {
    course.total_duration_sec = Math.max(0, (course.total_duration_sec || 0) - dur);
    await course.save();
  }

  res.json({ success: true, message: 'Lesson deleted' });
});
