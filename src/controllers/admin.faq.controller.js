// controllers/admin.faq.controller.js
const asyncHandler = require('express-async-handler');
const { Faq } = require('../models');

exports.list = asyncHandler(async (_req, res) => {
  const data = await Faq.findAll({
    order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
  });
  res.json({ success: true, data });
});

exports.getOne = asyncHandler(async (req, res) => {
  const faq = await Faq.findByPk(req.params.id);
  if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
  res.json({ success: true, data: faq });
});

exports.create = asyncHandler(async (req, res) => {
  const {
    question_ar, answer_ar,
    question_en, answer_en,
    sort_order = 0, is_active = true
  } = req.body;

  if (!question_ar || !answer_ar || !question_en || !answer_en) {
    return res.status(400).json({
      success: false,
      message: 'question_ar, answer_ar, question_en, answer_en are required'
    });
  }

  const faq = await Faq.create({
    question_ar, answer_ar, question_en, answer_en,
    sort_order: Number(sort_order) || 0,
    is_active: !!is_active
  });

  res.status(201).json({ success: true, message: 'FAQ created', data: faq });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const faq = await Faq.findByPk(id);
  if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });

  const {
    question_ar, answer_ar,
    question_en, answer_en,
    sort_order, is_active
  } = req.body;

  if (question_ar !== undefined) faq.question_ar = question_ar;
  if (answer_ar   !== undefined) faq.answer_ar   = answer_ar;
  if (question_en !== undefined) faq.question_en = question_en;
  if (answer_en   !== undefined) faq.answer_en   = answer_en;
  if (sort_order  !== undefined) faq.sort_order  = Number(sort_order) || 0;
  if (is_active   !== undefined) faq.is_active   = !!is_active;

  await faq.save();
  res.json({ success: true, message: 'FAQ updated', data: faq });
});

exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const faq = await Faq.findByPk(id);
  if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });

  await faq.destroy();
  res.json({ success: true, message: 'FAQ deleted' });
});
