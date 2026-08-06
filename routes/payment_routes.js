import express from 'express';
import { createPaymentIntent, getPaymentIntent } from '../controllers/payment_controller.js';

const router = express.Router();

router.post('/create-payment-intent', createPaymentIntent);
router.get('/payment-intent/:id', getPaymentIntent);

module.exports = router;