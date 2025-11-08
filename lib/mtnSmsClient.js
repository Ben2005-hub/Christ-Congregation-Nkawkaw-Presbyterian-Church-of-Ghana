const axios = require('axios');
const db = require('../db'); // for message logging

// MTN SMS Configuration - all from environment
const SUB_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const TOKEN_URL = process.env.MTN_TOKEN_URL;
const SMS_BASE = process.env.MTN_SMS_BASE;
const SENDER = process.env.MTN_SMS_SENDER;
const ENV = process.env.MTN_ENV || 'sandbox';
const SIMULATE = !process.env.MTN_CLIENT_ID || !process.env.MTN_CLIENT_SECRET || ENV === 'simulate';

// Token cache to avoid too many requests
let cached = { token: null, expiresAt: 0 };

// Basic auth header for client credentials
function basicAuthHeader(id, secret) {
  if (!id || !secret) return null;
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

// Fetch OAuth token using client credentials
async function getToken() {
  const now = Date.now();
  
  // Use cached token if valid
  if (cached.token && cached.expiresAt > now + 5000) {
    return cached.token;
  }

  if (SIMULATE) {
    console.log('[MTN] Simulated token - MTN credentials not configured');
    return 'simulated-token';
  }

  // Validate required config
  if (!TOKEN_URL) throw new Error('MTN token URL not configured (MTN_TOKEN_URL)');
  
  const clientId = process.env.MTN_CLIENT_ID;
  const clientSecret = process.env.MTN_CLIENT_SECRET;

  const auth = basicAuthHeader(clientId, clientSecret);
  if (!auth) throw new Error('Missing MTN credentials (MTN_CLIENT_ID/MTN_CLIENT_SECRET required)');

  try {
  // POST form-encoded grant request. Some MTN endpoints expect form data and a subscription key header.
  const tokenPayload = 'grant_type=client_credentials';
  const tokenHeaders = {
    Authorization: auth,
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  if (SUB_KEY) tokenHeaders['Ocp-Apim-Subscription-Key'] = SUB_KEY;

  const resp = await axios.post(TOKEN_URL, tokenPayload, { headers: tokenHeaders, timeout: 10000 });
  const token = resp.data.access_token || resp.data.accessToken || resp.data.token;
  const expiresIn = resp.data.expires_in || resp.data.expiresIn || 3600;
  
  cached.token = token;
  cached.expiresAt = now + (expiresIn * 1000);
  return token;
  } catch (err) {
    console.error('[MTN] Token error:', err.response?.data || err.message);
    throw new Error('Failed to get MTN access token: ' + err.message);
  }
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
      console.log(`[MTN] Simulated SMS to ${to}: ${text}`);
      logEntry.status = 'simulated';
      await db.logMessage(logEntry);
      return { success: true, simulated: true };
    }

    if (!SMS_BASE) throw new Error('MTN SMS base URL not configured (MTN_SMS_BASE)');
    if (!SENDER) throw new Error('MTN SMS sender not configured (MTN_SMS_SENDER)');
    
    const token = await getToken();
    const url = `${SMS_BASE.replace(/\/$/, '')}/v3/sms/messages/sms/outbound`;  // MTN v3 SMS endpoint

    const payload = {
      senderAddress: SENDER,
      serviceCode: SENDER, // Required field - using same as senderAddress
      receiverAddress: [to.startsWith('+') ? to : '+' + to],
      message: text,
      clientCorrelatorId: options.correlationId || Date.now().toString(),
      requestDeliveryReceipt: options.requestDeliveryReceipt || false
    };

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    if (SUB_KEY) headers['Ocp-Apim-Subscription-Key'] = SUB_KEY;

    const resp = await axios.post(url, payload, { headers, timeout: 10000 });

    logEntry.status = 'sent';
    logEntry.messageId = resp.data.messageId || resp.data.reference;
    await db.logMessage(logEntry);
    
    return {
      success: true,
      messageId: logEntry.messageId,
      response: resp.data
    };

  } catch (err) {
    logEntry.status = 'failed';
    logEntry.error = err.response?.data || err.message;
    await db.logMessage(logEntry);

    console.error('[MTN] Send error:', err.response?.data || err.message);
    throw new Error('Failed to send SMS: ' + err.message);
  }
}

module.exports = { getToken, sendSms };
