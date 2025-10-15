// Christ Congregation Nkawkaw — Presbyterian Church of Ghana Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ========== ROUTE IMPORTS ==========
const { registerMember, getAllMembers, setLastBirthdaySent } = require('./members');
const { addAdmin, authenticateAdmin, verifyToken } = require('./admins');
const { recordPayment, getAllPayments, getPaymentsForMember } = require('./payments');
const { sendSMS, sendBulkSMS } = require('./sms');

// ========== AUTH MIDDLEWARE ==========
function requireAuth(req, res, next) {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  req.admin = payload;
  next();
}

// ========== ADMIN ROUTES ==========
app.post('/api/admin/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  const result = addAdmin({ username, password });
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json({ success: true });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  const result = authenticateAdmin({ username, password });
  if (result.error) return res.status(401).json({ error: result.error });
  res.json(result);
});

// ========== MEMBER ROUTES ==========
app.post('/api/members', async (req, res) => {
  const data = req.body;
  if (!data.name || !data.phone)
    return res.status(400).json({ error: 'Name and phone are required' });

  const member = registerMember(data);
  try {
    await sendSMS(
      data.phone,
      `Welcome to Christ Congregation Nkawkaw — Presbyterian Church of Ghana, ${data.name}! Your registration is successful.`
    );
  } catch (err) {
    console.error('SMS error:', err.message);
  }
  res.status(201).json(member);
});

app.get('/api/members', requireAuth, (req, res) => {
  res.json(getAllMembers());
});

app.get('/api/members/public', (req, res) => {
  const list = getAllMembers().map(m => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    dob: m.dob,
    type: m.type
  }));
  res.json(list);
});

app.get('/api/members/search', requireAuth, (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json([]);
  const results = getAllMembers().filter(
    m =>
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q))
  );
  res.json(results);
});

app.delete('/api/members/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const { deleteMember } = require('./members');
  const ok = deleteMember(id);
  if (!ok) return res.status(404).json({ error: 'Member not found' });
  res.json({ success: true });
});

// ========== PAYMENT ROUTES ==========
app.post('/api/payments', async (req, res) => {
  const data = req.body;
  if (!data.memberId || !data.amount || !data.type)
    return res
      .status(400)
      .json({ error: 'memberId, amount, and type are required' });

  const payment = recordPayment(data);
  const member = getAllMembers().find(m => m.id === data.memberId);
  if (member) {
    try {
      await sendSMS(
        member.phone,
        `Dear ${member.name}, your ${data.type} payment of GHS${data.amount} has been received. Thank you! — Christ Congregation Nkawkaw`
      );
    } catch (err) {
      console.error('SMS error:', err.message);
    }
  }
  res.status(201).json(payment);
});

app.get('/api/payments', requireAuth, (req, res) => {
  res.json(getAllPayments());
});

app.get('/api/payments/member/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const list = getPaymentsForMember(id);
  res.json(list);
});

// ========== SMS ROUTES ==========
app.post('/api/sms/bulk', requireAuth, async (req, res) => {
  const { to, message, payloads } = req.body;
  try {
    let results;
    if (Array.isArray(payloads) && payloads.length > 0) {
      results = await sendBulkSMS(payloads);
    } else if (to && message) {
      results = await sendBulkSMS(to, message);
    } else {
      return res
        .status(400)
        .json({ error: 'Provide either payloads or (to and message)' });
    }
    res.json({ success: true, results });
  } catch (err) {
    console.error('Bulk SMS error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========== BIRTHDAY SMS LOGIC ==========
let birthdayTemplate = null;

app.get('/api/sms/birthday-template', requireAuth, (req, res) => {
  res.json({ template: birthdayTemplate });
});

app.post('/api/sms/birthday-template', requireAuth, (req, res) => {
  const { template } = req.body || {};
  birthdayTemplate = template || null;
  res.json({ success: true, template: birthdayTemplate });
});

app.post('/api/sms/birthday', requireAuth, async (req, res) => {
  const { template } = req.body || {};
  const today = new Date();
  const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const membersWithDob = getAllMembers().filter(m => m.dob);
  const targets = membersWithDob.filter(m => {
    const parts = m.dob.split('-');
    if (parts.length !== 3) return false;
    return `${parts[1]}-${parts[2]}` === mmdd;
  });
  if (targets.length === 0)
    return res.json({ success: true, message: 'No birthdays today' });

  const results = [];
  for (const t of targets) {
    const msg =
      (template ||
        birthdayTemplate ||
        `Happy Birthday, {name}! Blessings on your special day from Christ Congregation Nkawkaw — Presbyterian Church of Ghana.`).replace(
        /\{name\}/g,
        t.name
      );
    try {
      const r = await sendSMS(t.phone, msg);
      results.push({ to: t.phone, sid: r.sid });
    } catch (err) {
      results.push({ to: t.phone, error: err.message });
    }
  }
  res.json({ success: true, results, count: results.length });
});

// ========== HEALTH + ROOT ROUTES ==========
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend running successfully!',
    service: 'Christ Congregation Nkawkaw — Presbyterian Church of Ghana API'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Christ Congregation Nkawkaw — Presbyterian Church of Ghana API running',
    status: 'ok'
  });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
