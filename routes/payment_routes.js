const express = require('express');
const { createPaymentIntent, getPaymentIntent } = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-payment-intent', createPaymentIntent);
router.get('/payment-intent/:id', getPaymentIntent);

module.exports = router;