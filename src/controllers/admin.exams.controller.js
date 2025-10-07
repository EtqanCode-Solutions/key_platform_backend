// ============== إنشاء امتحان (كما هو مع تحسين بسيط) ==============
exports.createExam = async (req, res, next) => {
  try {
    const {
      slug, title, type, duration_min, difficulty, desc, published, questions,
    } = req.body;

    const exam = await Exam.create({
      slug, title, type, duration_min, difficulty, desc, published: !!published,
    });

    if (Array.isArray(questions) && questions.length) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qRow = await ExamQuestion.create({
          exam_id: exam.id,
          text: q.text,
          order_index: Number.isFinite(q.order_index) ? q.order_index : i,
        });

        if (Array.isArray(q.choices) && q.choices.length) {
          for (const c of q.choices) {
            await ExamChoice.create({
              question_id: qRow.id,
              key: c.key,
              text: c.text,
              is_correct: !!c.is_correct,
            });
          }
        }
      }
    }

    res.status(201).json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
};

// ============== قائمة الامتحانات ==============
exports.listExams = async (req, res, next) => {
  try {
    const rows = await Exam.findAll({
      order: [['createdAt', 'DESC']],
      attributes: { exclude: [] },
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ============== إحضار امتحان شامل أسئلة/اختيارات ==============
exports.getExamById = async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!Number.isFinite(examId)) {
      return res.status(400).json({ success: false, message: 'Invalid examId' });
    }

    const exam = await Exam.findByPk(examId, {
      include: [
        {
          model: ExamQuestion,
          as: 'questions',
          separate: true,
          order: [['order_index', 'ASC']],
          include: [
            {
              model: ExamChoice,
              as: 'choices',
              separate: true,
              order: [['key', 'ASC']],
            }
          ]
        }
      ]
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
};

// ============== إضافة أسئلة (قديمة) ==============
exports.addQuestions = async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!Number.isFinite(examId)) {
      return res.status(400).json({ success: false, message: 'Invalid examId' });
    }

    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0)
      return res.status(400).json({ success: false, message: "Questions array is required" });

    const createdQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qRow = await ExamQuestion.create({
        exam_id: examId,
        text: q.text,
        order_index: Number.isFinite(q.order_index) ? q.order_index : i,
      });

      if (Array.isArray(q.choices) && q.choices.length) {
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

    res.status(201).json({ success: true, data: createdQuestions });
  } catch (err) {
    next(err);
  }
};

// ============== تحديث خصائص الامتحان ==============
exports.updateExam = async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!Number.isFinite(examId)) {
      return res.status(400).json({ success: false, message: 'Invalid examId' });
    }

    const [n] = await Exam.update(req.body, { where: { id: examId } });
    if (!n) return res.status(404).json({ success: false, message: "Exam not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ============== نشر/إلغاء نشر ==============
exports.publish = async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!Number.isFinite(examId)) {
      return res.status(400).json({ success: false, message: 'Invalid examId' });
    }

    const [n] = await Exam.update({ published: true }, { where: { id: examId } });
    if (!n) return res.status(404).json({ success: false, message: "Exam not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.unpublish = async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!Number.isFinite(examId)) {
      return res.status(400).json({ success: false, message: 'Invalid examId' });
    }

    const [n] = await Exam.update({ published: false }, { where: { id: examId } });
    if (!n) return res.status(404).json({ success: false, message: "Exam not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ============== مزامنة/تعديل جماعي للأسئلة والاختيارات (جديد) ==============
exports.syncQuestions = async (req, res, next) => {
  const sequelize = Exam.sequelize;
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!Number.isFinite(examId)) {
      return res.status(400).json({ success: false, message: 'Invalid examId' });
    }

    // شكل البيانات المتوقّع:
    // { questions: [{ id?, text, order_index?, choices: [{ id?, key, text, is_correct }] }] }
    const incomingRaw = Array.isArray(req.body?.questions) ? req.body.questions : [];

    const incoming = incomingRaw.map((q, idx) => ({
      id: q.id ?? null,
      text: String(q.text ?? ''),
      order_index: Number.isFinite(q.order_index) ? Number(q.order_index) : idx,
      choices: Array.isArray(q.choices)
        ? q.choices.map(c => ({
            id: c.id ?? null,
            key: String(c.key ?? ''),
            text: String(c.text ?? ''),
            is_correct: !!c.is_correct
          }))
        : []
    }));

    await sequelize.transaction(async (t) => {
      // 1) الأسئلة الموجودة مع اختياراتها
      const existingQs = await ExamQuestion.findAll({
        where: { exam_id: examId },
        include: [{ model: ExamChoice, as: 'choices' }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const existingQMap = new Map(existingQs.map(q => [q.id, q]));
      const keptQuestionIds = new Set();

      // 2) Upsert لكل سؤال واختياراته
      for (const q of incoming) {
        let qInstance = null;

        if (q.id && existingQMap.has(q.id)) {
          // update question
          qInstance = existingQMap.get(q.id);
          await qInstance.update(
            { text: q.text, order_index: q.order_index, exam_id: examId },
            { transaction: t }
          );
        } else {
          // create question
          qInstance = await ExamQuestion.create(
            { exam_id: examId, text: q.text, order_index: q.order_index },
            { transaction: t }
          );
        }
        keptQuestionIds.add(qInstance.id);

        // ===== choices upsert =====
        const existingChoices = (qInstance.choices ?? []);
        const existingChoiceMap = new Map(existingChoices.map(c => [c.id, c]));
        const keptChoiceIds = new Set();

        for (const ch of q.choices) {
          if (ch.id && existingChoiceMap.has(ch.id)) {
            // update choice
            const chInst = existingChoiceMap.get(ch.id);
            await chInst.update(
              { key: ch.key, text: ch.text, is_correct: ch.is_correct, question_id: qInstance.id },
              { transaction: t }
            );
            keptChoiceIds.add(chInst.id);
          } else {
            // create choice
            const created = await ExamChoice.create(
              { question_id: qInstance.id, key: ch.key, text: ch.text, is_correct: ch.is_correct },
              { transaction: t }
            );
            keptChoiceIds.add(created.id);
          }
        }

        // حذف أي اختيارات لم تعد موجودة في الـ payload
        const toDeleteChoices = existingChoices
          .filter(c => !keptChoiceIds.has(c.id))
          .map(c => c.id);
        if (toDeleteChoices.length) {
          await ExamChoice.destroy({ where: { id: toDeleteChoices }, transaction: t });
        }
      }

      // 3) حذف الأسئلة (واختياراتها) التي لم تُرسل في الـ payload
      const toDeleteQuestions = existingQs
        .filter(q => !keptQuestionIds.has(q.id))
        .map(q => q.id);
      if (toDeleteQuestions.length) {
        await ExamChoice.destroy({ where: { question_id: toDeleteQuestions }, transaction: t });
        await ExamQuestion.destroy({ where: { id: toDeleteQuestions }, transaction: t });
      }
    });

    // 4) رجّع الصورة النهائية مرتبة
    const finalQuestions = await ExamQuestion.findAll({
      where: { exam_id: examId },
      include: [{ model: ExamChoice, as: 'choices' }],
      order: [
        ['order_index', 'ASC'],
        [{ model: ExamChoice, as: 'choices' }, 'key', 'ASC']
      ]
    });

    res.json({ success: true, data: finalQuestions });
  } catch (err) {
    next(err);
  }
};