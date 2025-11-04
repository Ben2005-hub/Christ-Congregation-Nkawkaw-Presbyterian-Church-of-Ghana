// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await db.findAdminByUsername(username);
    if (!admin) return res.render('login', { error: 'Invalid username or password' });
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.render('login', { error: 'Invalid username or password' });
    req.session.user = { username: admin.username, name: admin.name };
    res.redirect('/');
  } catch (err) {
    res.render('login', { error: 'Server error' });
  }
});

// One-time admin setup endpoint (creates initial admin if none exists)
router.get('/admin/setup', async (req, res) => {
  try {
    const created = await db.ensureInitialAdmin();
    if (created) res.send('Initial admin created: nkawkaw (password: Nkawkaw@123)');
    else res.send('Admin already exists');
  } catch (err) {
    res.status(500).send('Error creating admin');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
