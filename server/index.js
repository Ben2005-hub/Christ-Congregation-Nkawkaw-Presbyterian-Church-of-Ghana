// Entry point for Express backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Placeholder routes
app.get('/', (req, res) => {
  res.send('Christ Congregation Nkawkaw — Presbyterian Church of Ghana API running');
});


// Member logic
const { registerMember, getAllMembers } = require('./members');
const { setLastBirthdaySent } = require('./members');

// Admin logic
const { addAdmin, authenticateAdmin, verifyToken } = require('./admins');

function requireAuth(req, res, next) {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  req.admin = payload;
  next();
}

// Admin signup
app.post('/api/admin/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const result = addAdmin({ username, password });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json({ success: true });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const result = authenticateAdmin({ username, password });
  if (result.error) return res.status(401).json({ error: result.error });
  res.json(result);
});


// SMS logic
const { sendSMS } = require('./sms');

// new bulk SMS helper
const { sendBulkSMS } = require('./sms');

// Register a new member

// Register a new member (SMS sending temporarily disabled)
app.post('/api/members', async (req, res) => {
  const data = req.body;
  if (!data.name || !data.phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }
  const member = registerMember(data);
  try {
      await sendSMS(
        data.phone,
        `Welcome to Christ Congregation Nkakaw — Presbyterian Church of Ghana, ${data.name}! Your registration is successful.`
    );
  } catch (err) {
    console.error('SMS error:', err.message);
  }
  res.status(201).json(member);
});

// Get all members
app.get('/api/members', requireAuth, (req, res) => {
  res.json(getAllMembers());
});


// Payment logic
const { recordPayment, getAllPayments } = require('./payments');


// Record a payment (tithe or funeral due)

// Record a payment (tithe or funeral due) (SMS sending temporarily disabled)
app.post('/api/payments', requireAuth, async (req, res) => {
  const data = req.body;
  if (!data.memberId || !data.amount || !data.type) {
    return res.status(400).json({ error: 'memberId, amount, and type are required' });
  }
  const payment = recordPayment(data);
  const member = getAllMembers().find(m => m.id === data.memberId);
  if (member) {
    try {
        await sendSMS(
          member.phone,
          `Dear ${member.name}, your ${data.type} payment of GHS${data.amount} has been received. Thank you! — Christ Congregation Nkakaw`
      );
    } catch (err) {
      console.error('SMS error:', err.message);
    }
  }
  res.status(201).json(payment);
});

// Get all payments
app.get('/api/payments', requireAuth, (req, res) => {
  res.json(getAllPayments());
});

// Bulk SMS endpoint: { to: string|[string], message: string }
app.post('/api/sms/bulk', requireAuth, async (req, res) => {
  const { to, message, payloads } = req.body;
  try {
    let results;
    if (Array.isArray(payloads) && payloads.length > 0) {
      // payloads: [{ to, message }, ...]
      results = await sendBulkSMS(payloads);
    } else if (to && message) {
      results = await sendBulkSMS(to, message);
    } else {
      return res.status(400).json({ error: 'Provide either payloads or (to and message)' });
    }
    res.json({ success: true, results });
  } catch (err) {
    console.error('Bulk SMS error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Birthday SMS endpoint: sends to members whose DOB matches today (month-day)
app.post('/api/sms/birthday', requireAuth, async (req, res) => {
  // optional message template can be provided; else use stored template or default
  const { template } = req.body || {};
  const today = new Date();
  const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const membersWithDob = getAllMembers().filter(m => m.dob);
  const targets = membersWithDob.filter(m => {
    // m.dob stored as YYYY-MM-DD
    const parts = m.dob.split('-');
    if (parts.length !== 3) return false;
    return `${parts[1]}-${parts[2]}` === mmdd;
  });
  if (targets.length === 0) return res.json({ success: true, message: 'No birthdays today' });
  const recipients = targets.map(t => t.phone);
  const messages = targets.map(t => {
  const tmpl = template || birthdayTemplate || `Happy Birthday, {name}! Blessings on your special day from Christ Congregation Nkawkaw — Presbyterian Church of Ghana.`;
    return tmpl.replace(/\{name\}/g, t.name);
  });
  // send messages individually so personalization is kept
  const results = [];
  for (let i = 0; i < recipients.length; i++) {
    try {
      const r = await sendSMS(recipients[i], messages[i]);
      results.push({ to: recipients[i], sid: r.sid });
    } catch (err) {
      results.push({ to: recipients[i], error: err.message });
      console.error('Birthday SMS error for', recipients[i], err.message);
    }
  }
  res.json({ success: true, results, count: results.length });
});

// In-memory birthday template
let birthdayTemplate = null;

// Get birthday template
app.get('/api/sms/birthday-template', requireAuth, (req, res) => {
  res.json({ template: birthdayTemplate });
});

// Save birthday template
app.post('/api/sms/birthday-template', requireAuth, (req, res) => {
  const { template } = req.body || {};
  birthdayTemplate = template || null;
  res.json({ success: true, template: birthdayTemplate });
});

// Manual trigger for birthday check (useful for testing)
app.post('/api/sms/trigger-birthday-check', requireAuth, async (req, res) => {
  try {
    const results = await runBirthdayCheck();
    res.json({ success: true, results });
  } catch (err) {
    console.error('Trigger birthday check error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Birthday check logic (reusable)
async function runBirthdayCheck() {
  const today = new Date();
  const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isoToday = today.toISOString().slice(0, 10);
  const membersWithDob = getAllMembers().filter(m => m.dob);
  const targets = membersWithDob.filter(m => {
    const parts = m.dob.split('-');
    if (parts.length !== 3) return false;
    // avoid duplicate sends in same day
    if (m.lastBirthdaySent === isoToday) return false;
    return `${parts[1]}-${parts[2]}` === mmdd;
  });
  const results = [];
  for (const t of targets) {
  const tmpl = birthdayTemplate || `Happy Birthday, {name}! Blessings on your special day from Christ Congregation Nkawkaw — Presbyterian Church of Ghana.`;
  const msg = tmpl.replace(/\{name\}/g, t.name);
    try {
      const r = await sendSMS(t.phone, msg);
      results.push({ to: t.phone, sid: r.sid });
      setLastBirthdaySent(t.id, isoToday);
    } catch (err) {
      results.push({ to: t.phone, error: err.message });
      console.error('Automated birthday SMS error for', t.phone, err.message);
    }
  }
  return results;
}

// Scheduler: run at startup and then periodically.
const mode = process.env.BIRTHDAY_MODE || 'prod';
(async () => {
  try {
    // initial run
    await runBirthdayCheck();
  } catch (e) {
    console.error('Initial birthday check failed', e.message);
  }
  // dev: every minute; prod: every 24 hours
  const intervalMs = mode === 'dev' ? 60 * 1000 : 24 * 60 * 60 * 1000;
  setInterval(() => {
    runBirthdayCheck().catch(err => console.error('Scheduled birthday check error', err.message));
  }, intervalMs);
})();

// TODO: Add SMS integration

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
