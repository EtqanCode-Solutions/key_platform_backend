// controllers/admin.support.controller.js
const asyncHandler = require('express-async-handler');
const { SupportTicket, SupportMessage, Student, User } = require('../models');

exports.listAll = asyncHandler(async (req, res) => {
  const { status, topic, studentId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (topic) where.topic = topic;
  if (studentId) where.student_id = studentId;

  const tickets = await SupportTicket.findAll({
    where,
    include: [
      { model: Student, as: 'student', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] },
    ],
    order: [['last_activity_at', 'DESC']],
  });

  res.json({ success: true, data: tickets });
});

exports.getOne = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByPk(req.params.id, {
    include: [
      { model: SupportMessage, as: 'messages' },
      { model: Student, as: 'student', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] },
    ],
    order: [[{ model: SupportMessage, as: 'messages' }, 'created_at', 'ASC']],
  });
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  res.json({ success: true, data: ticket });
});

exports.assign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const ticket = await SupportTicket.findByPk(id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  ticket.assigned_to = userId ?? null;
  ticket.last_activity_at = new Date();
  await ticket.save();
  res.json({ success: true, message: 'Ticket assigned', data: ticket });
});

exports.setStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // open | pending | resolved | closed
  const ticket = await SupportTicket.findByPk(id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  if (!['open', 'pending', 'resolved', 'closed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  ticket.status = status;
  ticket.last_activity_at = new Date();
  await ticket.save();
  res.json({ success: true, message: 'Status updated', data: ticket });
});

exports.reply = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!body) return res.status(400).json({ success: false, message: 'body is required' });

  const ticket = await SupportTicket.findByPk(id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  await SupportMessage.create({
    ticket_id: ticket.id,
    sender_type: 'staff',
    sender_id: req.user.id, // من middleware
    body,
  });

  ticket.last_activity_at = new Date();
  if (ticket.status === 'open') ticket.status = 'pending';
  await ticket.save();

  const out = await SupportTicket.findByPk(ticket.id, {
    include: [{ model: SupportMessage, as: 'messages' }],
    order: [[{ model: SupportMessage, as: 'messages' }, 'created_at', 'ASC']],
  });

  res.json({ success: true, message: 'Replied', data: out });
});
