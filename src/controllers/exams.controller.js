const { fn, col } = require("sequelize");
const {
  Exam, ExamQuestion, ExamChoice, ExamAttempt, ExamAnswer,
  Notification, NotificationRecipient
} = require("../models");
const { issueExamCertificate } = require('../services/certificates.service');

const PASS_THRESHOLD = 70;

// GET /api/exams
exports.list = async (req, res, next) => {
  try {
    const rows = await Exam.findAll({
      where: { published: true },
      attributes: {
        include: [[fn("COUNT", col("questions.id")), "questions_count"]],
      },
      include: [{ model: ExamQuestion, as: "questions", attributes: [] }],
      group: ["Exam.id"],
      order: [["title", "ASC"]],
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/exams/:slug?includeCorrect=1
exports.getBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const includeCorrect = req.query.includeCorrect === "1"; // للأدمن/أدوات التصحيح

    const exam = await Exam.findOne({
      where: { slug, published: true },
      include: [
        {
          model: ExamQuestion,
          as: "questions",
          separate: true,
          order: [["order_index", "ASC"]],
          include: [
            {
              model: ExamChoice,
              as: "choices",
              attributes: includeCorrect
                ? undefined
                : { exclude: ["is_correct"] },
              order: [["key", "ASC"]],
            },
          ],
        },
      ],
    });

    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (err) {
    next(err);
  }
};

// POST /api/exams/:slug/attempts

exports.submitAttempt = async (req, res, next) => {
  const t0 = Date.now();
  try {
    const { slug } = req.params;
    const { usedSec, answers } = req.body;
    const studentId = req.student?.id;

    if (!studentId || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const exam = await Exam.findOne({
      where: { slug, published: true },
      attributes: ['id','title','duration_min'],
      include: [{
        model: ExamQuestion, as: 'questions',
        attributes: ['id','order_index'],
        include: [{ model: ExamChoice, as: 'choices', attributes: ['key','is_correct'] }]
      }]
    });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const qMap = new Map();
    for (const q of exam.questions) {
      const correct = q.choices.find(c => c.is_correct);
      qMap.set(q.id, { correctKey: correct ? correct.key : null });
    }

    let correctCount = 0;
    const total = exam.questions.length;
    const answerRows = [];

    for (const q of exam.questions) {
      const picked = answers.find(a => a.questionId === q.id);
      const chosenKey = picked ? picked.choiceKey : null;
      const correctKey = qMap.get(q.id).correctKey;
      const ok = chosenKey && correctKey && chosenKey === correctKey;
      if (ok) correctCount++;
      answerRows.push({
        question_id: q.id,
        chosen_key: chosenKey,
        is_correct: !!ok,
        correct_key: correctKey
      });
    }

    const scorePct = total ? Math.round((correctCount / total) * 100) : 0;
    const status = scorePct >= PASS_THRESHOLD ? 'pass' : 'fail';

    const attempt = await ExamAttempt.create({
      student_id: studentId,
      exam_id: exam.id,
      correct_count: correctCount,
      total_count: total,
      score_pct: scorePct,
      duration_sec: usedSec || 0,
      status
    });

    for (const row of answerRows) {
      await ExamAnswer.create({ attempt_id: attempt.id, ...row });
    }

    // ====== إصدار شهادة للامتحان عند النجاح ======
    let issuedCert = null;
    if (status === 'pass') {
      try {
        issuedCert = await issueExamCertificate({ studentId, examId: exam.id, scorePct });
        const n = await Notification.create({
          type: 'exam',
          title: 'شهادة نجاح في الامتحان',
          message: `أحسنت! تم إصدار شهادة لامتحان: ${issuedCert.title}. كود: ${issuedCert.verifyCode}`,
          action_link: '/app/certificates'
        });
        await NotificationRecipient.create({
          notification_id: n.id, student_id: studentId, read: false, deleted: false
        });
      } catch (e) {
        console.warn('[issueExamCertificate] failed:', e);
      }
    }

    res.json({
      attemptId: attempt.id,
      examId: exam.id,
      title: exam.title,
      correct: correctCount,
      total,
      scorePct,
      status,
      usedSec: usedSec || 0,
      issuedCertificateId: issuedCert?.id || null,
      serverMs: Date.now() - t0
    });
  } catch (err) { next(err); }
};
// GET /api/exams/attempts/:attemptId
exports.getAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const row = await ExamAttempt.findOne({
      where: { id: attemptId },
      include: [
        { model: Exam, as: "exam", attributes: ["slug", "title"] },
        {
          model: ExamAnswer,
          as: "answers",
          include: [
            {
              model: ExamQuestion,
              as: "question",
              attributes: ["id", "text", "order_index"],
              include: [
                {
                  model: ExamChoice,
                  as: "choices",
                  attributes: ["key", "text"],
                },
              ],
            },
          ],
        },
      ],
      order: [
        [
          { model: ExamAnswer, as: "answers" },
          { model: ExamQuestion, as: "question" },
          "order_index",
          "ASC",
        ],
      ],
    });

    if (!row) return res.status(404).json({ message: "Attempt not found" });
    res.json(row);
  } catch (err) {
    next(err);
  }
};

// GET /api/exams/history/me  (طالب فقط من التوكن)
exports.historyMe = async (req, res, next) => {
  try {
    // متوقع من protectStudent يضيف req.student = { id, type:'student', ... }
    const studentId = req.student?.id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });

    const rows = await ExamAttempt.findAll({
      where: { student_id: studentId },
      include: [{ model: Exam, as: "exam", attributes: ["slug", "title"] }],
      order: [["taken_at", "DESC"]],
    });

    const mapped = rows.map((r) => ({
      attemptId: r.id,
      examId: r.exam?.slug,
      examTitle: r.exam?.title,
      takenAtISO: r.taken_at,
      scorePct: r.score_pct,
      status: r.status,
      durationSec: r.duration_sec,
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
};

// GET /api/exams/history/:studentId  (أدمن فقط)
exports.historyByStudent = async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (!studentId)
      return res.status(400).json({ message: "studentId is required" });

    const rows = await ExamAttempt.findAll({
      where: { student_id: studentId },
      include: [{ model: Exam, as: "exam", attributes: ["slug", "title"] }],
      order: [["taken_at", "DESC"]],
    });

    const mapped = rows.map((r) => ({
      attemptId: r.id,
      examId: r.exam?.slug,
      examTitle: r.exam?.title,
      takenAtISO: r.taken_at,
      scorePct: r.score_pct,
      status: r.status,
      durationSec: r.duration_sec,
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
};
