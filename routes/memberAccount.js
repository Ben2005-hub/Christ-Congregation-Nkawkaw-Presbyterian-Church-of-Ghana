const express = require('express');
const router = express.Router();
const db = require('../db');

// Simple member-facing account where a member enters their phone
// and can view their payment totals and history for the session.

router.get('/', async (req, res) => {
  try {
    const memberSession = req.session.member || null;
    if (!memberSession) return res.render('members/dashboard', { member: null, payments: null, totals: null, q: '' });

    const member = memberSession;
    const payments = await db.getPaymentsByMember(member.id);
    const totals = await db.getPaymentTotalsByMember(member.id);
    res.render('members/dashboard', { member, payments, totals, q: member.phone });
  } catch (err) {
    console.error('Member dashboard error', err);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  try {
    const phone = (req.body.phone || '').trim();
    if (!phone) return res.render('members/dashboard', { member: null, payments: null, totals: null, q: '' });
    const members = await db.searchMembers(phone);
    if (!members || members.length === 0) return res.render('members/dashboard', { member: null, payments: [], totals: {}, q: phone, notFound: true });
    const member = members[0];
    // store minimal member info in session for convenience
    req.session.member = { id: member.id, name: member.name, phone: member.phone };
    res.redirect('/member');
  } catch (err) {
    console.error('Member login error', err);
    res.status(500).send('Server error');
  }
});

router.get('/logout', (req, res) => {
  delete req.session.member;
  res.redirect('/member');
});

module.exports = router;
