// controllers/support.controller.js
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { SupportTicket, SupportMessage, Student, User } = require('../models');

exports.createTicket = asyncHandler(async (req, res) => {
  const { topic = 'general', subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ success: false, message: 'subject and message are required' });
  }

  const ticket = await SupportTicket.create({
    student_id: req.student.id,
    topic,
    subject,
    status: 'open',
    last_activity_at: new Date(),
  });

  await SupportMessage.create({
    ticket_id: ticket.id,
    sender_type: 'student',
    sender_id: req.student.id,
    body: message,
  });

  const out = await SupportTicket.findByPk(ticket.id, {
    include: [
      { model: SupportMessage, as: 'messages', order: [['created_at', 'ASC']] },
    ],
  });

  return res.status(201).json({ success: true, message: 'Ticket created', data: out });
});

exports.myTickets = asyncHandler(async (req, res) => {
  const { status } = req.query; // اختياري
  const where = { student_id: req.student.id };
  if (status) where.status = status;

  const tickets = await SupportTicket.findAll({
    where,
    order: [['last_activity_at', 'DESC']],
    include: [{ model: SupportMessage, as: 'messages', limit: 1, order: [['created_at', 'DESC']] }],
  });

  res.json({ success: true, data: tickets });
});

exports.getTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await SupportTicket.findOne({
    where: { id, student_id: req.student.id },
    include: [
      { model: SupportMessage, as: 'messages', order: [['created_at', 'ASC']] },
      { model: Student, as: 'student', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] },
    ],
    order: [[{ model: SupportMessage, as: 'messages' }, 'created_at', 'ASC']],
  });
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  res.json({ success: true, data: ticket });
});

exports.addMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!body) return res.status(400).json({ success: false, message: 'body is required' });

  const ticket = await SupportTicket.findOne({ where: { id, student_id: req.student.id } });
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  if (ticket.status === 'closed') {
    return res.status(409).json({ success: false, message: 'Ticket is closed' });
  }

  await SupportMessage.create({
    ticket_id: ticket.id,
    sender_type: 'student',
    sender_id: req.student.id,
    body,
  });

  ticket.last_activity_at = new Date();
  if (ticket.status === 'resolved') ticket.status = 'pending'; // رجّعها pending لو الطالب رد
  await ticket.save();

  const out = await SupportTicket.findByPk(ticket.id, {
    include: [{ model: SupportMessage, as: 'messages' }],
    order: [[{ model: SupportMessage, as: 'messages' }, 'created_at', 'ASC']],
  });

  res.json({ success: true, message: 'Message added', data: out });
});

exports.closeMyTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await SupportTicket.findOne({ where: { id, student_id: req.student.id } });
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  ticket.status = 'closed';
  ticket.last_activity_at = new Date();
  await ticket.save();
  res.json({ success: true, message: 'Ticket closed' });
});
