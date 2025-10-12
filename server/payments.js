const payments = [];

// Record a payment (tithe or funeral due)
function recordPayment(data) {
  const id = payments.length + 1;
  const payment = { id, ...data, date: new Date().toISOString() };
  payments.push(payment);
  return payment;
}

// Get all payments
function getAllPayments() {
  return payments;
}

module.exports = {
  recordPayment,
  getAllPayments
};
