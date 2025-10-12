// Twilio SMS utility
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const SMS_SIMULATE = String(process.env.SMS_SIMULATE || '').toLowerCase() === 'true';
let client;
if (!SMS_SIMULATE && accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

function fakeSid() {
  return 'SIM-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

// send to single recipient
async function sendSMS(to, message) {
  if (SMS_SIMULATE) {
    // simulate network delay
    await new Promise(r => setTimeout(r, 100));
    return { sid: fakeSid(), to, body: message };
  }
  if (!client) throw new Error('Twilio not configured');
  return client.messages.create({ body: message, from: fromNumber, to });
}

// accept array of recipients or single. recipients can be:
// - ["+233..."] with single message param
// - [{ to: "+233...", message: "Hi Name" }, ...] to provide per-recipient messages
async function sendBulkSMS(recipients, message) {
  const list = Array.isArray(recipients) ? recipients : [recipients];
  const results = [];
  for (const entry of list) {
    let to, body;
    if (typeof entry === 'string') {
      to = entry;
      body = message;
    } else if (entry && typeof entry === 'object') {
      to = entry.to;
      body = entry.message || message;
    } else {
      results.push({ to: entry, error: 'Invalid recipient format' });
      continue;
    }
    if (SMS_SIMULATE) {
      // simulate success/failure
      await new Promise(r => setTimeout(r, 50));
      // small chance to simulate an error
      if (Math.random() < 0.03) {
        results.push({ to, error: 'Simulated send error' });
      } else {
        results.push({ to, sid: fakeSid() });
      }
      continue;
    }
    if (!client) {
      results.push({ to, error: 'Twilio not configured' });
      continue;
    }
    try {
      const res = await client.messages.create({ body, from: fromNumber, to });
      results.push({ to, sid: res.sid });
    } catch (err) {
      results.push({ to, error: err.message });
    }
  }
  return results;
}

module.exports = { sendSMS, sendBulkSMS };
