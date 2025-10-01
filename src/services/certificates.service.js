// services/certificates.service.js
const { Certificate, Course, Exam } = require('../models');
const { generateUniqueCode } = require('../utils/certificates');

function toHours(decSec) {
  if (!decSec) return null;
  const hours = Math.round((decSec / 3600) * 10) / 10;
  return hours || null;
}

async function issueCourseCertificate({ studentId, courseId }) {
  const course = await Course.findByPk(courseId);
  if (!course) throw new Error('Course not found');

  // منع التكرار لنفس الطالب ونفس العنوان
  const exists = await Certificate.findOne({
    where: { student_id: studentId, kind: 'course', title: course.title }
  });
  if (exists) return exists;

  const verifyCode = await generateUniqueCode('ETQ-CRS');

  return Certificate.create({
    id: `c-${studentId}-${courseId}-${Date.now()}`,
    student_id: studentId,
    kind: 'course',
    title: course.title,
    issuedAt: new Date(),
    provider: 'Etqan Academy',
    hours: toHours(course.total_duration_sec || 0),
    verifyCode,
    theme: 'classic'
  });
}

async function issueExamCertificate({ studentId, examId, scorePct }) {
  const exam = await Exam.findByPk(examId);
  if (!exam) throw new Error('Exam not found');

  const exists = await Certificate.findOne({
    where: { student_id: studentId, kind: 'exam', title: exam.title }
  });
  if (exists) return exists;

  const verifyCode = await generateUniqueCode('ETQ-EXM');
  const grade = scorePct >= 90 ? 'A' : scorePct >= 80 ? 'B' : scorePct >= 70 ? 'C' : 'D';

  return Certificate.create({
    id: `e-${studentId}-${examId}-${Date.now()}`,
    student_id: studentId,
    kind: 'exam',
    title: exam.title,
    issuedAt: new Date(),
    provider: 'Etqan Academy',
    scorePct,
    grade,
    verifyCode,
    theme: 'modern'
  });
}

module.exports = { issueCourseCertificate, issueExamCertificate };
