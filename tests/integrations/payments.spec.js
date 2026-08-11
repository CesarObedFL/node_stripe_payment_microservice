import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

describe('Integración con Stripe API (sin correos)', () => {
    let createdPaymentIntentId;

    it('POST /api/payments/create-payment-intent → debe crear un PaymentIntent válido', async () => {
        const response = await request(app)
            .post('/api/payments/create-payment-intent')
            .send({
                plan_id: 'freelance_basic',
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('clientSecret');
        expect(response.body.clientSecret).toMatch(/^pi_.*_secret_.*$/);

        const clientSecret = response.body.clientSecret;
        createdPaymentIntentId = clientSecret.split('_secret_')[0];
    });

    it('POST /api/payments/create-payment-intent → debe rechazar plan_id inválido', async () => {
        const response = await request(app)
            .post('/api/payments/create-payment-intent')
            .send({
                plan_id: 'plan_invalido',
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid plan_id');
    });

    it('POST /api/payments/create-payment-intent → debe aceptar plan_id válido sin email', async () => {
        const response = await request(app)
            .post('/api/payments/create-payment-intent')
            .send({
                plan_id: 'maintenance_basic',
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('clientSecret');
    });

    it('POST /api/payments/create-payment-intent → debe devolver el monto correcto según el plan', async () => {
        const response = await request(app)
            .post('/api/payments/create-payment-intent')
            .send({
                plan_id: 'freelance_premium',
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('clientSecret');

        const clientSecret = response.body.clientSecret;
        const paymentIntentId = clientSecret.split('_secret_')[0];
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        expect(paymentIntent.amount).toBe(46400); // 464 USD en centavos
        expect(paymentIntent.currency).toBe('usd');
    });

    afterAll(async () => {
        if (createdPaymentIntentId) {
            try {
                await stripe.paymentIntents.cancel(createdPaymentIntentId);
                console.log(`🧹 PaymentIntent ${createdPaymentIntentId} cancelado.`);
            } catch (error) {
                console.log('⚠️ No se pudo cancelar el PaymentIntent:', error.message);
            }
        }
    });
});