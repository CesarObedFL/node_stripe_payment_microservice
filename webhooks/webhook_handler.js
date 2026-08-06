const stripe = require('../services/stripe_service');

/**
 * Handle incoming webhook requests.
 * @param {Object} req - Express request object (raw body).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
exports.handle_webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhook_secret = process.env.STRIPE_WEBHOOK_SECRET;

    // If secret not set, skip verification (development only)
    if (!webhook_secret) {
        console.warn('⚠️ STRIPE_WEBHOOK_SECRET not set. Skipping signature verification.');
        return process_event(req.body, res);
    }

    if (!sig) {
        return res.status(400).send('Missing stripe-signature header');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhook_secret);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await process_event(event, res);
};

/**
 * Process the webhook event based on its type.
 * @param {Object} event - Stripe event object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
async function process_event(event, res) {
    console.log(`📩 Received webhook event: ${event.type}`);

    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log(`✅ PaymentIntent ${event.data.object.id} succeeded`);
            // Add custom logic here (e.g., update database)
            break;
        case 'payment_intent.payment_failed':
            console.log(`❌ PaymentIntent ${event.data.object.id} failed`);
            break;
        default:
            console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
}