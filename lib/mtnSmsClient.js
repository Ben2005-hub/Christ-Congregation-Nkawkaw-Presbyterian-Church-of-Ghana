const axios = require('axios');
const db = require('../db'); // for message logging

// SMS provider configuration - Arkesel only
const AKASEL_URL = process.env.AKASEL_API_URL;
const AKASEL_KEY = process.env.AKASEL_API_KEY;
const SENDER = process.env.SMS_SENDER;
const SIMULATE = process.env.SMS_PROVIDER === 'simulate';

function normalizeNumber(to) {
  if (!to) return to;
  let n = String(to).trim();
  // remove spaces and common separators
  n = n.replace(/[\s\-()]/g, '');
  // if starts with 00 -> convert to +
  if (n.startsWith('00')) n = '+' + n.slice(2);
  // Ghana local numbers often start with 0 (e.g. 0541234567) -> convert to +233...
  if (n.match(/^0\d{8,9}$/)) n = '+233' + n.slice(1);
  // if purely digits and length looks like international without +, add +
  if (/^\d+$/.test(n) && n.length >= 9) n = '+' + n;
  return n;
}

async function sendSms(to, text, options = {}) {
  // Log the message attempt
  const logEntry = {
    to,
    text,
    sender: SENDER || 'SIMULATED',
    timestamp: new Date(),
    status: 'pending'
  };

  try {
    if (SIMULATE) {
      console.log(`[SMS] Simulated SMS to ${to}: ${text}`);
      logEntry.status = 'simulated';
      await db.logMessage(logEntry);
      return { success: true, simulated: true };
    }

    // Arkesel SMS API
    if (!AKASEL_URL || !AKASEL_KEY) throw new Error('Arkesel API not configured (AKASEL_API_URL / AKASEL_API_KEY)');
    const url = AKASEL_URL.replace(/\/$/, '');
    const params = {
      action: 'send-sms',
      api_key: AKASEL_KEY,
      to: normalizeNumber(to),
      from: SENDER || '',
      sms: text
    };
    // support scheduling via options.schedule (ISO string or Arkesel expected format)
    if (options.schedule) params.schedule = options.schedule;

    const resp = await axios.get(url, { params, timeout: 10000 });
    // Arkesel returns plain text or json depending on request; normalize
    const data = resp.data;
    logEntry.status = 'sent';
    // try a few possible id fields
    logEntry.messageId = data?.id || data?.messageId || (typeof data === 'string' ? data : undefined);
    await db.logMessage(logEntry);
    return { success: true, messageId: logEntry.messageId, response: data };

  } catch (err) {
      logEntry.status = 'failed';
      // include HTTP status if available to aid debugging
      logEntry.error = {
        message: err.message,
        status: err.response?.status,
        body: err.response?.data
      };
      await db.logMessage(logEntry);

      console.error('[SMS] Send error:', logEntry.error);
      const statusText = err.response?.status ? ` (status ${err.response.status})` : '';
      throw new Error('Failed to send SMS: ' + err.message + statusText);
  }
}

module.exports = { sendSms };
// Arkesel helper functions
module.exports.checkAkaselBalance = async function() {
  if (!AKASEL_URL || !AKASEL_KEY) throw new Error('Arkesel API not configured (AKASEL_API_URL / AKASEL_API_KEY)');
  const url = AKASEL_URL.replace(/\/$/, '');
  const params = { action: 'check-balance', api_key: AKASEL_KEY, response: 'json' };
  const resp = await axios.get(url, { params, timeout: 10000 });
  return resp.data;
};

module.exports.subscribeAkaselContact = async function(bookName, phone, firstName, lastName, email, company, userName) {
  if (!AKASEL_URL || !AKASEL_KEY) throw new Error('Arkesel API not configured (AKASEL_API_URL / AKASEL_API_KEY)');
  const contactUrl = (AKASEL_URL.replace(/\/$/, '').replace('/sms/api','/contacts/api'));
  const params = {
    action: 'subscribe-us',
    api_key: AKASEL_KEY,
    phone_book: bookName,
    phone_number: phone,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    email: email || undefined,
    company: company || undefined,
    user_name: userName || undefined
  };
  const resp = await axios.get(contactUrl, { params, timeout: 10000 });
  return resp.data;
};
