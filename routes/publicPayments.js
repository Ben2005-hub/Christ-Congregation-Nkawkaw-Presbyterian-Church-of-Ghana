const express = require('express');
const router = express.Router();
const db = require('../db');

// Public interface: lookup payments by phone number
router.get('/', (req, res) => {
  res.render('public/payments', { payments: null, totals: null, q: '' });
});

router.post('/lookup', async (req, res) => {
  try {
    const q = (req.body.phone || '').trim();
    if (!q) return res.render('public/payments', { payments: [], totals: {}, q });
    // find members matching phone
    const members = await db.searchMembers(q);
    if (!members || members.length === 0) return res.render('public/payments', { payments: [], totals: {}, q });
    // If multiple members, pick the first (or show a choice later)
    const member = members[0];
    const payments = await db.getPaymentsByMember(member.id);
    const totals = await db.getPaymentTotalsByMember(member.id);
    res.render('public/payments', { payments, totals, member, q });
  } catch (err) {
    console.error('Public payments lookup error', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
