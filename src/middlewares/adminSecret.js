module.exports = function adminSecret(req, res, next) {
  const secret = req.header('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized (admin secret invalid)' });
  }
  next();
};
