const axios = require('axios');

const SUB_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const TOKEN_URL = process.env.MTN_TOKEN_URL; // full token endpoint provided by portal
const SMS_BASE = process.env.MTN_SMS_BASE; // base url for SMS API
const SENDER = process.env.MTN_SMS_SENDER; // sender id / shortcode

let cached = { token: null, expiresAt: 0 };

function basicAuthHeader(id, secret) {
  if (!id || !secret) return null;
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

async function getToken() {
  const now = Date.now();
  if (cached.token && cached.expiresAt > now + 5000) return cached.token;
  if (!TOKEN_URL) throw new Error('MTN token URL not configured (MTN_TOKEN_URL)');
  if (!SUB_KEY) throw new Error('MTN subscription key not configured (MTN_SUBSCRIPTION_KEY)');

  // Determine credentials
  const apiUserId = process.env.MTN_API_USER_ID;
  const apiUserKey = process.env.MTN_API_USER_KEY;
  const clientId = process.env.MTN_CLIENT_ID;
  const clientSecret = process.env.MTN_CLIENT_SECRET;

  const auth = basicAuthHeader(apiUserId && apiUserKey ? apiUserId : clientId, apiUserKey ? apiUserKey : clientSecret);
  if (!auth) throw new Error('Missing API credentials (set MTN_API_USER_ID/MTN_API_USER_KEY or MTN_CLIENT_ID/MTN_CLIENT_SECRET)');

  const resp = await axios.post(TOKEN_URL, 'grant_type=client_credentials', {
    headers: {
      Authorization: auth,
      'Ocp-Apim-Subscription-Key': SUB_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const token = resp.data.access_token || resp.data.accessToken || resp.data.token;
  const expiresIn = resp.data.expires_in || resp.data.expiresIn || 3600;
  cached.token = token;
  cached.expiresAt = Date.now() + (expiresIn * 1000);
  return token;
}

async function sendSms(to, text) {
  if (!SMS_BASE) throw new Error('MTN SMS base URL not configured (MTN_SMS_BASE)');
  if (!SENDER) throw new Error('MTN SMS sender not configured (MTN_SMS_SENDER)');
  const token = await getToken();
  const url = `${SMS_BASE.replace(/\/$/, '')}/messaging/v1/outbound/${encodeURIComponent(SENDER)}/requests`;

  const payload = {
    outboundSMSMessageRequest: {
      address: `tel:${to}`,
      outboundSMSTextMessage: { message: text },
      senderAddress: SENDER
    }
  };

  const resp = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': SUB_KEY,
      'Content-Type': 'application/json'
    }
  });
  return resp.data;
}

module.exports = { getToken, sendSms };
