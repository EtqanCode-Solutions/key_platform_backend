const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `انت مساعد ذكي متخصص في مادة ${process.env.AI_SUBJECT}. جاوب فقط بما يخص المادة دي.`,
        },
        { role: 'user', content: message },
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('❌ Chatbot error:', err.message);
    res.status(500).json({ error: 'AI chatbot failed' });
  }
});

module.exports = router;
