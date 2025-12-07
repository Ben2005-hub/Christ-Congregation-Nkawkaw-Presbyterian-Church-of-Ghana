const express = require('express');
const router = express.Router();
const db = require('../db');
const smsClient = require('../lib/mtnSmsClient');

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

// SMS admin tools
router.get('/sms', ensureAuth, async (req, res) => {
  try {
    let balance = null;
    if (process.env.SMS_PROVIDER === 'akasel' || process.env.SMS_PROVIDER === 'arkesel') {
      try { balance = await smsClient.checkAkaselBalance(); } catch (e) { balance = { error: e.message }; }
    }
    res.render('admin/sms', { provider: process.env.SMS_PROVIDER || 'mtn', balance });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/sms/send', ensureAuth, async (req, res) => {
  try {
    const { to, message, schedule, schedule_mode } = req.body;
    const options = {};
    if (schedule_mode && schedule) options.schedule = schedule;
    const resp = await smsClient.sendSms(to, message, options);
    req.session.flash = { type: 'success', message: 'SMS sent' };
    res.redirect('/admin/sms');
  } catch (err) {
    console.error('Admin SMS send error', err);
    req.session.flash = { type: 'danger', message: 'Failed to send SMS: ' + err.message };
    res.redirect('/admin/sms');
  }
});

// Debug: view recent SMS message_log entries (admin only)
router.get('/sms/logs', ensureAuth, async (req, res) => {
  try {
    db.db.all('SELECT * FROM message_log ORDER BY id DESC LIMIT 200', (err, rows) => {
      if (err) return res.status(500).send('Failed to read logs');
      // render simple JSON view for debugging
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(rows, null, 2));
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
