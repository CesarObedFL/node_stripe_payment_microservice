import stripe from '../services/stripe_service.js';

/**
 * Maps plan identifiers to their corresponding details.
 *
 * @param {string} plan_id - The plan identifier (e.g., 'freelance_basic')
 * @return {object} Plan details including amount, currency, description, and metadata.
 */
const getPlanDetails = (plan_id) => {
    const plans = {
        'freelance_basic': {
            amount: 11600,  // $116.00 USD incluye IVA
            currency: 'usd',
            description: 'Freelance - Básico: Diseño personalizado, 5 páginas, SEO, CMS',
            metadata: {
                plan_type: 'freelance',
                plan_name: 'Básico',
                base_price: '100.00',
                tax: '16.00',
                includes: 'Diseño personalizado, Optimización móvil, SEO, CMS'
            }
        },
        'freelance_standard': {
            amount: 29000,  // $290.00 USD incluye IVA
            currency: 'usd',
            description: 'Freelance - Standard: Panel administración, 10 páginas, BD, Autenticación',
            metadata: {
                plan_type: 'freelance',
                plan_name: 'Standard',
                base_price: '250.00',
                tax: '40.00',
                includes: 'Panel administración, Gestión usuarios/roles, Integración BD, Autenticación'
            }
        },
        'freelance_premium': {
            amount: 46400,  // $464.00 USD incluye IVA
            currency: 'usd',
            description: 'Freelance - Premium: E-commerce con Bagisto, páginas ilimitadas',
            metadata: {
                plan_type: 'freelance',
                plan_name: 'Premium',
                base_price: '400.00',
                tax: '64.00',
                includes: 'E-commerce con Bagisto, Páginas ilimitadas, Funcionalidades avanzadas'
            }
        },
        'maintenance_basic': {
            amount: 8120,   // $81.20 USD incluye IVA
            currency: 'usd',
            description: 'Mantenimiento - Básico: Preventivo y correctivo básico',
            metadata: {
                plan_type: 'maintenance',
                plan_name: 'Básico',
                base_price: '70.00',
                tax: '11.20',
                includes: 'Mantenimiento preventivo/correctivo, Copia seguridad, Repositorio Git'
            }
        },
        'maintenance_specialized': {
            amount: 17400,  // $174.00 USD incluye IVA
            currency: 'usd',
            description: 'Mantenimiento - Especializado: Respuesta prioritaria, monitoreo continuo',
            metadata: {
                plan_type: 'maintenance',
                plan_name: 'Especializado',
                base_price: '150.00',
                tax: '24.00',
                includes: 'Monitoreo proactivo 24/7, Corrección errores prioridad, Documentación, Auditoría seguridad'
            }
        },
        'maintenance_custom': {
            amount: 2320,   // $23.20 USD/hr incluye IVA
            currency: 'usd',
            description: 'Mantenimiento - Personalizado: Servicio por hora',
            metadata: {
                plan_type: 'maintenance',
                plan_name: 'Personalizado',
                base_price: '20.00',
                tax: '3.20',
                includes: 'Servicio a la carta, por hora pagada'
            }
        }
    };

    if (!plans[plan_id]) {
        throw new Error(`Plan not found: ${plan_id}`);
    }

    return plans[plan_id];
};

/**
 * Creates a PaymentIntent for a selected plan.
 *
 * POST /api/payments/create-payment-intent
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @return {Promise<void>}
 */
exports.createPaymentIntent = async (req, res) => {
    try {
        const { plan_id, customer_email, metadata = {} } = req.body;

        // Validate plan_id
        if (!plan_id) {
            return res.status(400).json({
                error: 'Missing "plan_id". Available plans: freelance_basic, freelance_standard, freelance_premium, maintenance_basic, maintenance_specialized, maintenance_custom'
            });
        }

        // Get plan details
        const plan = getPlanDetails(plan_id);

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: plan.amount,
            currency: plan.currency,
            description: plan.description,
            receipt_email: customer_email || undefined,
            metadata: {
                ...plan.metadata,
                ...metadata,
                plan_id: plan_id,
                service: 'payment-microservice',
                timestamp: new Date().toISOString()
            },
            // Para suscripciones mensuales, descomenta:
            // payment_method_types: ['card'],
            // setup_future_usage: 'off_session' // si quieres cobrar recurrente
        });

        res.status(201).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            plan: plan.metadata
        });

    } catch (error) {
        console.error('❌ Error creating PaymentIntent:', error);
        res.status(500).json({
            error: 'Failed to create payment intent',
            message: error.message
        });
    }
};