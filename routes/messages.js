const express = require('express');
const router = express.Router();
const db = require('../db');
let mtnClient;
try { mtnClient = require('../lib/mtnSmsClient'); } catch (e) { mtnClient = null; }

function ensureAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

// Compose message page - show members with checkboxes
router.get('/compose', ensureAuth, async (req, res) => {
  try {
    const contacts = await db.getMemberContacts();
    const preselect = req.query.preselect;
    res.render('messages/compose', { contacts, preselect });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Send message (simulated) - recipients are an array of member IDs
router.post('/send', ensureAuth, async (req, res) => {
  try {
    const { recipients, content } = req.body; // recipients may be comma-separated or array
    let ids = [];
    if (!recipients) return res.status(400).send('No recipients');
    if (Array.isArray(recipients)) ids = recipients;
    else ids = recipients.split(',');

    // Fetch phone numbers
    const rows = await db.getMemberContacts();
    const byId = {};
    rows.forEach(r => byId[r.id] = r);

    // Simulate sending and log
    const sendResults = [];
    for (const id of ids) {
      const member = byId[id];
      if (!member) continue;
      // If MTN configured, attempt to send SMS, otherwise just log
      try {
        if (mtnClient && process.env.MTN_SMS_BASE) {
          await mtnClient.sendSms(member.phone || '', content);
        }
      } catch (err) {
        console.error('MTN send failed', err && err.message);
      }
      // Always log the message locally
      await db.logMessage(member.phone || '', content);
      sendResults.push({ to: member.phone, name: member.name });
    }

    res.render('messages/compose', { contacts: rows, success: `Sent to ${sendResults.length} recipients.` });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// History page - show message_log
router.get('/history', ensureAuth, (req, res) => {
  db.db.all('SELECT * FROM message_log ORDER BY sent_at DESC LIMIT 200', (err, rows) => {
    if (err) return res.status(500).send('Server error');
    res.render('messages/history', { logs: rows });
  });
});

module.exports = router;
