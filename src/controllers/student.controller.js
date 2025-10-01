const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Student } = require('../models');

const signToken = (student) =>
  jwt.sign({ id: student.id, type: 'student' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '1d'
  });


exports.list = asyncHandler(async (req, res) => {
  const students = await Student.findAll({ attributes: { exclude: ['password'] } });
  res.json({ success: true, data: students });
});

exports.getById = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: student });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const { name, email, password, stage } = req.body;
  const student = await Student.findByPk(req.student.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  if (email && email !== student.email) {
    const exists = await Student.findOne({ where: { email } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });
    student.email = email;
  }
  if (name) student.name = name;
  if (stage) student.stage = stage;
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    student.password = hash;
  }
  await student.save();
  res.json({ success: true, message: 'Profile updated', data: student });
});


exports.deleteMe = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.student.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  await student.destroy();
  res.json({ success: true, message: 'Account deleted' });
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, stage } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'name, email, password are required' });

  const exists = await Student.findOne({ where: { email } });
  if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });

  const hash = await bcrypt.hash(password, 10);
  const student = await Student.create({ name, email, password: hash, stage });

  const token = signToken(student);
  res.status(201).json({ success: true, message: 'Registered', data: student, token });
});


exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'email and password are required' });

  const student = await Student.findOne({ where: { email } });
  if (!student) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, student.password);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signToken(student);
  res.json({ success: true, message: 'Logged in', data: student, token });
});


exports.me = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.student.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: student });
});

// === Admin-only: update any student by :id (لا تغيّر الموجود فوق)
exports.adminUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, stage } = req.body;

  const student = await Student.findByPk(id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  if (email && email !== student.email) {
    const exists = await Student.findOne({ where: { email } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });
    student.email = email;
  }
  if (name)  student.name  = name;
  if (stage) student.stage = stage;

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    student.password = hash;
  }

  await student.save();
  const out = student.toJSON();
  delete out.password;
  res.json({ success: true, message: 'Student updated (admin)', data: out });
});

// === Admin-only: delete any student by :id
exports.adminDelete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await Student.findByPk(id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  await student.destroy();
  res.json({ success: true, message: 'Student deleted (admin)' });
});
