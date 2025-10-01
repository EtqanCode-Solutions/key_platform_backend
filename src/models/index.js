const { sequelize } = require("../config/db");

const User = require("./User")(sequelize);
const Student = require("./Student")(sequelize);
const Course = require("./Course")(sequelize);
const Lesson = require("./Lesson")(sequelize);
const Enrollment = require("./Enrollment")(sequelize);
const LessonProgress = require("./LessonProgress")(sequelize);
const Certificate = require("./Certificate")(sequelize);

const Exam = require("./Exam")(sequelize);
const ExamQuestion = require("./ExamQuestion")(sequelize);
const ExamChoice = require("./ExamChoice")(sequelize);
const ExamAttempt = require("./ExamAttempt")(sequelize);
const ExamAnswer = require("./ExamAnswer")(sequelize);

const Notification = require("./Notification")(sequelize);
const NotificationRecipient = require("./NotificationRecipient")(sequelize);

// Course ↔ Lessons
Course.hasMany(Lesson, { foreignKey: "course_id", as: "lessons" });
Lesson.belongsTo(Course, { foreignKey: "course_id", as: "course" });

// Student ↔ Course (through Enrollment)
Student.belongsToMany(Course, {
  through: Enrollment,
  foreignKey: "student_id",
  otherKey: "course_id",
  as: "enrolledCourses",
});
Course.belongsToMany(Student, {
  through: Enrollment,
  foreignKey: "course_id",
  otherKey: "student_id",
  as: "students",
});

Enrollment.belongsTo(Student, { foreignKey: "student_id", as: "student" });
Enrollment.belongsTo(Course, { foreignKey: "course_id", as: "course" });
Student.hasMany(Enrollment, { foreignKey: "student_id", as: "enrollments" });
Course.hasMany(Enrollment, { foreignKey: "course_id", as: "enrollments" });

// Progress
LessonProgress.belongsTo(Student, { foreignKey: "student_id", as: "student" });
LessonProgress.belongsTo(Lesson, { foreignKey: "lesson_id", as: "lesson" });
Student.hasMany(LessonProgress, {
  foreignKey: "student_id",
  as: "lessonProgress",
});
Lesson.hasMany(LessonProgress, { foreignKey: "lesson_id", as: "progress" });

// Certificates
Certificate.belongsTo(Student, { foreignKey: "student_id", as: "student" });
Student.hasMany(Certificate, { foreignKey: "student_id", as: "certificates" });

// Exam ↔ Questions ↔ Choices
Exam.hasMany(ExamQuestion, { foreignKey: "exam_id", as: "questions" });
ExamQuestion.belongsTo(Exam, { foreignKey: "exam_id", as: "exam" });

ExamQuestion.hasMany(ExamChoice, { foreignKey: "question_id", as: "choices" });
ExamChoice.belongsTo(ExamQuestion, {
  foreignKey: "question_id",
  as: "question",
});

// Attempts & Answers
ExamAttempt.belongsTo(Student, { foreignKey: "student_id", as: "student" });
Student.hasMany(ExamAttempt, { foreignKey: "student_id", as: "examAttempts" });

ExamAttempt.belongsTo(Exam, { foreignKey: "exam_id", as: "exam" });
Exam.hasMany(ExamAttempt, { foreignKey: "exam_id", as: "attempts" });

ExamAnswer.belongsTo(ExamAttempt, { foreignKey: "attempt_id", as: "attempt" });
ExamAttempt.hasMany(ExamAnswer, { foreignKey: "attempt_id", as: "answers" });

ExamAnswer.belongsTo(ExamQuestion, {
  foreignKey: "question_id",
  as: "question",
});
ExamQuestion.hasMany(ExamAnswer, { foreignKey: "question_id", as: "answers" });

// Notification ↔ Student (through NotificationRecipient)
Notification.belongsToMany(Student, {
  through: NotificationRecipient,
  foreignKey: "notification_id",
  otherKey: "student_id",
  as: "recipients",
});
Student.belongsToMany(Notification, {
  through: NotificationRecipient,
  foreignKey: "student_id",
  otherKey: "notification_id",
  as: "notifications",
});

Notification.hasMany(NotificationRecipient, {
  foreignKey: "notification_id",
  as: "recipientRows",
});
NotificationRecipient.belongsTo(Notification, {
  foreignKey: "notification_id",
  as: "notification",
});

Student.hasMany(NotificationRecipient, {
  foreignKey: "student_id",
  as: "notificationRows",
});
NotificationRecipient.belongsTo(Student, {
  foreignKey: "student_id",
  as: "student",
});

module.exports = {
  sequelize,
  User,
  Student,
  Course,
  Lesson,
  Enrollment,
  LessonProgress,
  Certificate,
  Exam,
  ExamQuestion,
  ExamChoice,
  ExamAttempt,
  ExamAnswer,
  Notification,
  NotificationRecipient,
};
