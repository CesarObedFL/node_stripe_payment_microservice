// webhooks/webhook_handler.js
import stripe from '../services/stripe_service.js';
import { send_email } from '../services/email_service.js';
import { save_payment_record } from '../services/storage_service.js';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL;

/**
 * Handles incoming Stripe webhook events.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @return {Promise<void>}
 */
async function handle_webhook(req, res) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.warn('⚠️ STRIPE_WEBHOOK_SECRET not set. Skipping signature verification.');
        return process_event(req.body, res);
    }

    if (!sig) {
        return res.status(400).send('Missing stripe-signature header');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await process_event(event, res);
}

/**
 * Processes the webhook event based on its type.
 *
 * @param {object} event - Stripe event object
 * @param {object} res - Express response object
 * @return {Promise<void>}
 */
async function process_event(event, res) {
    console.log(`📩 Received webhook event: ${event.type}`);

    switch (event.type) {
        case 'payment_intent.succeeded':
            await handle_payment_succeeded(event.data.object);
            break;

        case 'payment_intent.payment_failed':
            await handle_payment_failed(event.data.object);
            break;

        case 'charge.refunded':
            await handle_charge_refunded(event.data.object);
            break;

        default:
            console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
}

/**
 * Handles successful payment intent.
 *
 * @param {object} paymentIntent - The succeeded PaymentIntent object
 * @return {Promise<void>}
 */
async function handle_payment_succeeded(paymentIntent) {
    console.log(`✅ PaymentIntent ${paymentIntent.id} succeeded`);
    console.log(`💰 Amount: ${paymentIntent.amount} ${paymentIntent.currency}`);
    console.log(`📦 Plan: ${paymentIntent.metadata.plan_id || 'unknown'}`);
    console.log(`👤 Customer: ${paymentIntent.receipt_email || 'no email'}`);

    const customerEmail = paymentIntent.receipt_email;
    const planName = paymentIntent.metadata.plan_name || paymentIntent.metadata.plan_id || 'Plan adquirido';

    // save the payment info into the storage microservice
    try {
        await save_payment_record({
            payment_intent_id: paymentIntent.id,
            plan_id: paymentIntent.metadata.plan_id || 'unknown',
            plan_name: planName,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            customer_email: customerEmail || 'no-email@example.com',
            metadata: paymentIntent.metadata,
            status: 'succeeded'
        });
    } catch (error) {
        console.error('⚠️ Storage save failed but continuing...');
    }

    // emailing to the client
    if (customerEmail) {
        await send_email(
            customerEmail,
            `✅ Confirmación de pago - ${planName}`,
            `Hemos recibido tu pago por <strong>${planName}</strong>.<br>
             <strong>Monto:</strong> ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}<br>
             <strong>ID:</strong> ${paymentIntent.id}<br>
             En breve recibirás más información sobre la activación de tu servicio.<br><br>
             Saludos,<br>El equipo de CesarObedFL`
        );
    }

    // notify to the admin
    if (ADMIN_EMAIL) {
        await send_email(
            ADMIN_EMAIL,
            `💰 Nuevo pago recibido - ${planName}`,
            `Cliente: ${customerEmail || 'Sin email'}<br>
             Plan: ${planName}<br>
             Monto: ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}<br>
             ID: ${paymentIntent.id}<br>
             Metadatos: ${JSON.stringify(paymentIntent.metadata)}`
        );
    }
}

/**
 * Handles failed payment intent.
 *
 * @param {object} paymentIntent - The failed PaymentIntent object
 * @return {Promise<void>}
 */
async function handle_payment_failed(paymentIntent) {
    console.log(`❌ PaymentIntent ${paymentIntent.id} failed`);
    const customerEmail = paymentIntent.receipt_email;
    const planName = paymentIntent.metadata.plan_name || paymentIntent.metadata.plan_id || 'Plan';

    // emailing to the client
    if (customerEmail) {
        await send_email(
            customerEmail,
            `❌ Problema con tu pago - ${planName}`,
            `Tu pago por <strong>${planName}</strong> no pudo ser procesado.<br>
             Por favor, intenta nuevamente o contacta a soporte si el problema persiste.<br>
             ID de transacción: ${paymentIntent.id}<br><br>
             Saludos,<br>El equipo de CesarObedFL`
        );
    }

    // notify to the admin
    if (ADMIN_EMAIL) {
        await send_email(
            ADMIN_EMAIL,
            `⚠️ Pago fallido - ${planName}`,
            `Cliente: ${customerEmail || 'Sin email'}<br>
             Plan: ${planName}<br>
             ID: ${paymentIntent.id}<br>
             Motivo: ${paymentIntent.last_payment_error?.message || 'Desconocido'}`
        );
    }
}

/**
 * Handles refunded charge.
 *
 * @param {object} charge - The refunded Charge object
 * @return {Promise<void>}
 */
async function handle_charge_refunded(charge) {
    console.log(`↩️ Charge ${charge.id} was refunded`);
    const customerEmail = charge.receipt_email;
    const amountRefunded = charge.amount_refunded || charge.amount;
    const currency = charge.currency;

    // emailing to the client
    if (customerEmail) {
        await send_email(
            customerEmail,
            `↩️ Reembolso procesado - ${charge.id}`,
            `Se ha procesado un reembolso por <strong>${(amountRefunded / 100).toFixed(2)} ${currency.toUpperCase()}</strong>.<br>
             El importe se reflejará en tu tarjeta en los próximos días.<br>
             ID de cargo: ${charge.id}<br><br>
             Saludos,<br>El equipo de CesarObedFL`
        );
    }

    // notify to the admin
    if (ADMIN_EMAIL) {
        await send_email(
            ADMIN_EMAIL,
            `↩️ Reembolso realizado - ${charge.id}`,
            `Cliente: ${customerEmail || 'Sin email'}<br>
             Monto reembolsado: ${(amountRefunded / 100).toFixed(2)} ${currency.toUpperCase()}<br>
             ID de cargo: ${charge.id}<br>
             Motivo: ${charge.refund_reason || 'No especificado'}`
        );
    }
}

export default handle_webhook;