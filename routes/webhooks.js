const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

// We need raw body to compute HMAC. In app.js we will ensure express.json verify preserves raw body.

function verifySignature(req, secret, headerName) {
  const sig = req.headers[headerName];
  if (!sig || !secret) return false;
  const computed = crypto.createHmac('sha256', secret).update(req.rawBody).digest('base64');
  return computed === sig;
}

router.post('/mtn/sms', express.json({ verify: (req, res, buf) => { req.rawBody = buf } }), async (req, res) => {
  try {
    const secret = process.env.MTN_WEBHOOK_SECRET || process.env.MTN_API_USER_KEY;
    const ok = verifySignature(req, secret, 'x-mtn-signature') || verifySignature(req, secret, 'x-callback-signature');
    if (!ok) {
      console.warn('SMS webhook signature failed');
      return res.status(401).send('Invalid signature');
    }
    // Example payload shape varies by portal. Log the body to message_log for traceability
    const body = req.body;
    const to = body.to || (body.address && body.address[0]) || '';
    const content = JSON.stringify(body);
    await db.logMessage(to, content);
    res.status(200).send('OK');
  } catch (err) {
    console.error('SMS webhook error', err);
    res.status(500).send('Server error');
  }
});

router.post('/mtn/momo', express.json({ verify: (req, res, buf) => { req.rawBody = buf } }), async (req, res) => {
  try {
    const secret = process.env.MTN_WEBHOOK_SECRET || process.env.MTN_API_USER_KEY;
    const ok = verifySignature(req, secret, 'x-mtn-signature') || verifySignature(req, secret, 'x-callback-signature');
    if (!ok) {
      console.warn('MoMo webhook signature failed');
      return res.status(401).send('Invalid signature');
    }
    // Handle payment notification: payload shape depends on portal. For now, log the notification
    const body = req.body;
    console.log('MoMo notification', body);
    // Optionally: insert/mark message/payment in DB here
    res.status(200).send('OK');
  } catch (err) {
    console.error('MoMo webhook error', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
