const express = require('express');
const { create_payment_intent, get_payment_intent } = require('../controllers/payment_controller');

const router = express.Router();

router.post('/create-payment-intent', create_payment_intent);
router.get('/payment-intent/:id', get_payment_intent);

module.exports = router;