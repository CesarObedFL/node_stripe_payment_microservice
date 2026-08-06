const stripe = require('../services/stripeService');

/**
 * Handles incoming Stripe webhook events.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @return {Promise<void>}
 */
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.warn('⚠️ STRIPE_WEBHOOK_SECRET not set. Skipping signature verification.');
        return processEvent(req.body, res);
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

    await processEvent(event, res);
};

/**
 * Processes the webhook event based on its type.
 *
 * @param {object} event - Stripe event object
 * @param {object} res - Express response object
 * @return {Promise<void>}
 */
async function processEvent(event, res) {
    console.log(`📩 Received webhook event: ${event.type}`);

    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSucceeded(event.data.object);
            break;

        case 'payment_intent.payment_failed':
            await handlePaymentFailed(event.data.object);
            break;

        case 'charge.refunded':
            await handleChargeRefunded(event.data.object);
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
async function handlePaymentSucceeded(paymentIntent) {
    console.log(`✅ PaymentIntent ${paymentIntent.id} succeeded`);
    console.log(`💰 Amount: ${paymentIntent.amount} ${paymentIntent.currency}`);
    console.log(`📦 Plan: ${paymentIntent.metadata.plan_id || 'unknown'}`);
    console.log(`👤 Customer: ${paymentIntent.receipt_email || 'no email'}`);

    // 1. sent email for confirmation to the client
    // 2. notify to the frontend the payment successful
}

/**
 * Handles failed payment intent.
 *
 * @param {object} paymentIntent - The failed PaymentIntent object
 * @return {Promise<void>}
 */
async function handlePaymentFailed(paymentIntent) {
    console.log(`❌ PaymentIntent ${paymentIntent.id} failed`);
    // Aquí puedes notificar al cliente que el pago falló
}

/**
 * Handles refunded charge.
 *
 * @param {object} charge - The refunded Charge object
 * @return {Promise<void>}
 */
async function handleChargeRefunded(charge) {
    console.log(`↩️ Charge ${charge.id} was refunded`);
    // Aquí puedes revertir el estado del plan
}