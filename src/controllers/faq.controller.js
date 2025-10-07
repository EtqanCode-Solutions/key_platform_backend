// controllers/faq.controller.js
const asyncHandler = require('express-async-handler');
const { Faq } = require('../models');

const pickLang = (row, lang) => {
  const isAr = (lang || '').toLowerCase().startsWith('ar');
  return {
    id: row.id,
    question: isAr ? row.question_ar : row.question_en,
    answer:   isAr ? row.answer_ar   : row.answer_en,
    sort_order: row.sort_order,
  };
};

exports.listPublic = asyncHandler(async (req, res) => {
  const { lang, both } = req.query; // ?lang=ar|en  أو ?both=1 لإرجاع اللغتين
  const faqs = await Faq.findAll({
    where: { is_active: true },
    order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });

  if (both === '1' || both === 'true') {
    // أرجع النسختين سويًا
    const data = faqs.map(f => ({
      id: f.id,
      ar: { question: f.question_ar, answer: f.answer_ar },
      en: { question: f.question_en, answer: f.answer_en },
      sort_order: f.sort_order,
    }));
    return res.json({ success: true, data });
  }

  // أرجع لغة واحدة فقط بحسب ?lang (افتراضي EN لو مش محدد)
  const data = faqs.map(f => pickLang(f, lang || 'en'));
  res.json({ success: true, data });
});
