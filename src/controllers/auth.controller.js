const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const signToken = (user, remember = false) => {
  const expiresIn = remember ? (process.env.JWT_EXPIRES_REMEMBER || '7d') : (process.env.JWT_EXPIRES || '1d');
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'user' },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'name, email, password are required' });

  const exists = await User.findOne({ where: { email } });
  if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, role: role || 'USER' });

  const token = signToken(user, false);
  res.status(201).json({ success: true, message: 'Registered', data: user, token });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password, remember } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'email and password are required' });

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signToken(user, !!remember);
  res.json({ success: true, message: 'Logged in', data: user, token });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});
