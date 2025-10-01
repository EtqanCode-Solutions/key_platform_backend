const { Exam, ExamQuestion, ExamChoice } = require("../models");

exports.createExam = async (req, res, next) => {
  try {
    const {
      slug,
      title,
      type,
      duration_min,
      difficulty,
      desc,
      published,
      questions,
    } = req.body;
    const exam = await Exam.create({
      slug,
      title,
      type,
      duration_min,
      difficulty,
      desc,
      published: !!published,
    });

    if (Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qRow = await ExamQuestion.create({
          exam_id: exam.id, // integer now
          text: q.text,
          order_index: q.order_index ?? i,
        });

        if (Array.isArray(q.choices)) {
          for (const c of q.choices) {
            await ExamChoice.create({
              question_id: qRow.id, // integer now
              key: c.key,
              text: c.text,
              is_correct: !!c.is_correct,
            });
          }
        }
      }
    }

    res.status(201).json(exam);
  } catch (err) {
    next(err);
  }
};

exports.addQuestions = async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0)
      return res.status(400).json({ message: "Questions array is required" });

    const createdQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qRow = await ExamQuestion.create({
        exam_id: examId,
        text: q.text,
        order_index: q.order_index ?? i,
      });

      if (Array.isArray(q.choices)) {
        for (const c of q.choices) {
          await ExamChoice.create({
            question_id: qRow.id,
            key: c.key,
            text: c.text,
            is_correct: !!c.is_correct,
          });
        }
      }

      createdQuestions.push(qRow);
    }

    res.status(201).json(createdQuestions);
  } catch (err) {
    next(err);
  }
};

exports.updateExam = async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const [n] = await Exam.update(req.body, { where: { id: examId } });
    if (!n) return res.status(404).json({ message: "Exam not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.publish = async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const [n] = await Exam.update(
      { published: true },
      { where: { id: examId } }
    );
    if (!n) return res.status(404).json({ message: "Exam not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.unpublish = async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const [n] = await Exam.update(
      { published: false },
      { where: { id: examId } }
    );
    if (!n) return res.status(404).json({ message: "Exam not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
