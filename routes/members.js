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
    const members = await db.getMembers();
    res.render('members/list', { members });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/:id', ensureAuth, async (req, res) => {
  try {
    const member = await db.getMemberById(req.params.id);
    if (!member) return res.status(404).send('Not found');
    res.render('members/edit', { member });
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
    
    // On success, redirect to members list
    res.redirect('/members');
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).send('Failed to delete member');
  }
});

module.exports = router;
