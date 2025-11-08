const express = require('express');
const router = express.Router();
const db = require('../db');

function ensureAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

// Public signup form
router.get('/add', (req, res) => {
  res.render('members/add');
});

router.post('/add', async (req, res) => {
  try {
    await db.addMember(req.body);
    res.render('members/add', { success: 'Thank you — your information was submitted.' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Admin-only list
router.get('/', ensureAuth, async (req, res) => {
  try {
    const q = req.query.q;
    const members = q ? await db.searchMembers(q) : await db.getMembers();
    // If searching, enrich results with payment totals for quick overview
    if (q && members && members.length > 0) {
      for (const m of members) {
        try {
          m.totals = await db.getPaymentTotalsByMember(m.id);
        } catch (e) { m.totals = {}; }
      }
    }
    res.render('members/list', { members, q });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/:id', ensureAuth, async (req, res) => {
  try {
    const member = await db.getMemberById(req.params.id);
    if (!member) return res.status(404).send('Not found');
    // also fetch payments and totals for this member
    const payments = await db.getPaymentsByMember(req.params.id);
    const totals = await db.getPaymentTotalsByMember(req.params.id);
    res.render('members/edit', { member, payments, totals });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update member
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const { name, phone, birthday, group_name, email, gender, address } = req.body;
    await new Promise((resolve, reject) => {
      const stmt = `UPDATE members SET name=?, phone=?, birthday=?, group_name=?, email=?, gender=?, address=? WHERE id=?`;
      db.db.run(stmt, [name, phone, birthday || null, group_name, email, gender, address, req.params.id], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
    res.redirect('/members/' + req.params.id);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete member
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      // First delete related records from messages table
      db.db.run('DELETE FROM messages WHERE recipient_type = "member" AND recipient_id = ?', [req.params.id], (err) => {
        if (err) return reject(err);
        
        // Then delete the member
        db.db.run('DELETE FROM members WHERE id = ?', [req.params.id], function(err) {
          if (err) return reject(err);
          if (this.changes === 0) return reject(new Error('Member not found'));
          resolve();
        });
      });
    });
    
  // On success, set a flash message and redirect to members list
  req.session.flash = { type: 'success', message: 'Member deleted successfully.' };
  res.redirect('/members');
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).send('Failed to delete member');
  }
});

module.exports = router;
