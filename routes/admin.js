const express = require('express');
const router = express.Router();
const db = require('../db');

function ensureAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

router.get('/signup', ensureAuth, (req, res) => {
  res.render('admin/signup');
});

router.post('/signup', ensureAuth, async (req, res) => {
  try {
    const { username, name, password } = req.body;
    await db.addAdmin({ username, name, password });
    res.render('admin/signup', { success: 'Admin account created.' });
  } catch (err) {
    res.render('admin/signup', { error: 'Failed to create admin. Username may already exist.' });
  }
});

module.exports = router;
