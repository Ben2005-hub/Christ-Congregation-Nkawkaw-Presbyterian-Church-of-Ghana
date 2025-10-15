// sms.js — Africa's Talking SMS integration
require('dotenv').config();
const axios = require('axios');

const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';
const apiKey = process.env.AFRICASTALKING_API_KEY;
const senderId = process.env.AFRICASTALKING_SENDER_ID || '';
const simulate = process.env.SMS_SIMULATE === 'true';

async function sendSMS(to, message) {
  if (simulate) {
    console.log(`[SIMULATED SMS] To: ${to}, Message: ${message}`);
    return { simulated: true };
  }

  const url = 'https://api.africastalking.com/version1/messaging';
  const data = new URLSearchParams({
    username,
    to,
    message,
    from: senderId
  });

  try {
    const res = await axios.post(url, data, {
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log('SMS sent:', res.data);
    return res.data;
  } catch (err) {
    console.error('SMS sending failed:', err.response?.data || err.message);
    throw err;
  }
}

async function sendBulkSMS(payloads) {
  const results = [];
  for (const p of payloads) {
    try {
      const r = await sendSMS(p.to, p.message);
      results.push({ to: p.to, success: true, result: r });
    } catch (err) {
      results.push({ to: p.to, success: false, error: err.message });
    }
  }
  return results;
}

module.exports = { sendSMS, sendBulkSMS };
