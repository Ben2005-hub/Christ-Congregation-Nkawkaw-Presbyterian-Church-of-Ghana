const express = require('express');
const router = express.Router();
const db = require('../db');

function ensureAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

// Delete a payment by id (admin only)
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const payment = await db.getPaymentById(req.params.id);
    if (!payment) {
      req.session.flash = { type: 'warning', message: 'Payment not found' };
      return res.redirect('back');
    }
    await db.deletePayment(req.params.id);
    req.session.flash = { type: 'success', message: 'Payment deleted' };
    // redirect back to member detail
    res.redirect('/members/' + payment.member_id);
  } catch (err) {
    console.error('Delete payment error:', err);
    req.session.flash = { type: 'danger', message: 'Failed to delete payment' };
    res.redirect('back');
  }
});

module.exports = router;
