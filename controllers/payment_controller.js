import stripe from '../services/stripe_service.js';

/**
 * Obtiene los detalles de un plan según su identificador.
 *
 * @param {string} plan_id - Identificador del plan (ej. 'freelance_basic')
 * @returns {object} Datos del plan (monto, moneda, descripción, metadatos)
 * @throws {Error} Si el plan no existe
 */
const get_plan_details = (plan_id) => {
    const plans = {
        'freelance_basic': {
            amount: 11600,
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
            amount: 29000,
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
            amount: 46400,
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
            amount: 8120,
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
            amount: 17400,
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
            amount: 2320,
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
 * Crea un PaymentIntent para un plan seleccionado.
 *
 * POST /api/payments/create-payment-intent
 *
 * @param {object} req - Objeto de solicitud de Express
 * @param {object} res - Objeto de respuesta de Express
 * @returns {Promise<void>}
 */
export const create_payment_intent = async (req, res) => {
    try {
        const { plan_id, customer_email, metadata = {} } = req.body;

        // Validar que se haya enviado plan_id
        if (!plan_id) {
            return res.status(400).json({
                error: 'Missing "plan_id". Available plans: freelance_basic, freelance_standard, freelance_premium, maintenance_basic, maintenance_specialized, maintenance_custom'
            });
        }

        // Obtener detalles del plan (lanza error si no existe)
        const plan = get_plan_details(plan_id);

        // Crear PaymentIntent en Stripe
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
            }
        });

        // Responder con éxito
        res.status(201).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            plan: plan.metadata
        });

    } catch (error) {
        console.error('❌ Error creating PaymentIntent:', error);

        // Si el error es por plan no encontrado, responder con 400
        if (error.message && error.message.startsWith('Plan not found')) {
            return res.status(400).json({
                error: 'Invalid plan_id',
                message: error.message
            });
        }

        // Otros errores (por ejemplo, de Stripe) → 500
        res.status(500).json({
            error: 'Failed to create payment intent',
            message: error.message
        });
    }
};

/**
 * Obtiene un PaymentIntent existente por su ID.
 *
 * GET /api/payments/payment-intent/:id
 *
 * @param {object} req - Objeto de solicitud de Express
 * @param {object} res - Objeto de respuesta de Express
 * @returns {Promise<void>}
 */
export const get_payment_intent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: 'PaymentIntent ID is required'
            });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(id);

        res.status(200).json({
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            clientSecret: paymentIntent.client_secret,
            metadata: paymentIntent.metadata
        });

    } catch (error) {
        console.error('❌ Error retrieving PaymentIntent:', error);
        res.status(500).json({
            error: 'Failed to retrieve payment intent',
            message: error.message
        });
    }
};