import express from 'express';
import { create_payment_intent, get_payment_intent } from '../controllers/payment_controller.js';

const router = express.Router();

router.post('/create-payment-intent', create_payment_intent);
router.get('/payment-intent/:id', get_payment_intent);

export default router;