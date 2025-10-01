// utils/certificates.js
const { Certificate } = require('../models');

function rand(n = 4) {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < n; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

async function generateUniqueCode(prefix = 'ETQ') {
  // مثال: ETQ-CRS-A7K3-2
  for (let i = 0; i < 10; i++) {
    const code = `${prefix}-${rand(3)}-${rand(2)}`;
    const exists = await Certificate.findOne({ where: { verifyCode: code } });
    if (!exists) return code;
  }
  return `${prefix}-${Date.now()}`; // fallback لو الدنيا زحمت
}

module.exports = { generateUniqueCode };
