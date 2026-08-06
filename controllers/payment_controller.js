const stripe = require('../services/stripe_service');

/**
 * Create a new PaymentIntent.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
exports.create_payment_intent = async (req, res) => {
    try {
        const { amount, currency = 'usd', metadata = {}, payment_method_types = ['card'] } = req.body;

        // Validate required fields
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                error: 'Invalid or missing "amount". Must be a positive number in the smallest currency unit (e.g., 1000 for $10.00).'
            });
        }

        const payment_intent = await stripe.paymentIntents.create({
            amount: Math.round(amount),
            currency,
            payment_method_types,
            metadata: {
                ...metadata,
                service: 'payment-microservice',
                timestamp: new Date().toISOString()
            }
        });

        res.status(201).json({
            client_secret: payment_intent.client_secret,
            payment_intent_id: payment_intent.id,
            amount: payment_intent.amount,
            currency: payment_intent.currency
        });

    } catch (error) {
        console.error('❌ Error creating PaymentIntent:', error);
        res.status(500).json({
            error: 'Failed to create payment intent',
            message: error.message
        });
    }
};

/**
 * Retrieve an existing PaymentIntent by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
exports.get_payment_intent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'PaymentIntent ID is required' });
        }

        const payment_intent = await stripe.paymentIntents.retrieve(id);
        res.status(200).json({
            id: payment_intent.id,
            amount: payment_intent.amount,
            currency: payment_intent.currency,
            status: payment_intent.status,
            client_secret: payment_intent.client_secret,
            metadata: payment_intent.metadata
        });

    } catch (error) {
        console.error('❌ Error retrieving PaymentIntent:', error);
        res.status(500).json({
            error: 'Failed to retrieve payment intent',
            message: error.message
        });
    }
};