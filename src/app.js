const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/error');
const { sequelize } = require('./models');

const adminCourses = require('./routes/admin.courses.routes');
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');

const courseRoutes = require('./routes/courses.routes');
const lessonRoutes = require('./routes/lessons.routes');
const progressRoutes = require('./routes/progress.routes');
const certRoutes = require('./routes/cert.routes');

const chatbotRoutes = require('./routes/chatbot.routes');

const examsRoutes = require('./routes/exams.routes');
const adminExamsRoutes = require('./routes/admin.exams.routes');

const notificationsRoutes = require('./routes/notifications.routes');
const adminNotificationsRoutes = require('./routes/admin.notifications.routes');

const supportRoutes = require('./routes/support.routes');
const adminSupportRoutes = require('./routes/admin.support.routes');

const faqRoutes = require('./routes/faq.routes');
const adminFaqRoutes = require('./routes/admin.faq.routes');



const app = express();

// CORS
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin, credentials: true }));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes); 
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/certificates', certRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/admin/exams', adminExamsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin/notifications', adminNotificationsRoutes);
app.use('/api/admin', adminCourses);
app.use('/api/support', supportRoutes);
app.use('/api/admin/support', adminSupportRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/admin/faq', adminFaqRoutes);

// Error handler
app.use(errorHandler);

// DB connect & sync (dev)
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // dev: ممكن { alter: true }
    console.log('✅ DB connected & synced');
  } catch (err) {
    console.error('❌ DB error:', err.message);
  }
})();

module.exports = app;
