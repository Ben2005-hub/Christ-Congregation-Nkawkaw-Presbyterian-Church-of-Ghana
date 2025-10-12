const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'payments.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let payments = [];
try {
  if (fs.existsSync(DATA_FILE)) payments = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
} catch (e) {
  console.error('Failed to load payments data', e.message);
  payments = [];
}

function persist() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(payments, null, 2)); } catch (e) { console.error('Failed to persist payments', e.message); }
}

// Record a payment (tithe or funeral due)
function recordPayment(data) {
  const id = payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1;
  const payment = { id, ...data, date: new Date().toISOString() };
  payments.push(payment);
  persist();
  return payment;
}

// Get all payments
function getAllPayments() {
  return payments;
}

function getPaymentsForMember(memberId) {
  return payments.filter(p => Number(p.memberId) === Number(memberId));
}

module.exports = { recordPayment, getAllPayments, getPaymentsForMember };
