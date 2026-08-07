// services/storage_service.js
import dotenv from 'dotenv';

dotenv.config();

const STORAGE_MS_URL = process.env.STORAGE_MS_URL || 'http://localhost:4000';
const STORAGE_TOKEN = process.env.STORAGE_TOKEN;
const STORAGE_PROJECT = 'services-payments';
const STORAGE_FILE = 'services-payments.json';

/**
 * Saves a payment record to the storage microservice.
 *
 * @param {object} paymentData - Payment data to store.
 * @param {string} paymentData.payment_intent_id - Stripe PaymentIntent ID.
 * @param {string} paymentData.plan_id - ID of the purchased plan.
 * @param {string} paymentData.plan_name - Name of the plan.
 * @param {number} paymentData.amount - Amount in cents.
 * @param {string} paymentData.currency - Currency code.
 * @param {string} paymentData.customer_email - Customer email.
 * @param {object} paymentData.metadata - Additional metadata.
 * @param {string} paymentData.status - Payment status ('succeeded', 'failed', etc.).
 * @return {Promise<object>} The created record.
 * @throws {Error} If the storage service request fails.
 */
export async function save_payment_record(paymentData) {
    if (!STORAGE_TOKEN) {
        console.warn('⚠️ STORAGE_TOKEN not set. Skipping storage save.');
        return null;
    }

    const url = `${STORAGE_MS_URL}/storage/${STORAGE_PROJECT}/${STORAGE_FILE}/records`;

    const payload = {
        payment_intent_id: paymentData.payment_intent_id,
        plan_id: paymentData.plan_id,
        plan_name: paymentData.plan_name,
        amount: paymentData.amount,
        currency: paymentData.currency,
        customer_email: paymentData.customer_email,
        metadata: paymentData.metadata,
        status: paymentData.status || 'succeeded',
        created_at: new Date().toISOString()
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STORAGE_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Storage service error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        console.log(`💾 Payment record saved with ID: ${result.id || 'unknown'}`);
        return result;
    } catch (error) {
        console.error('❌ Failed to save payment record:', error.message);
        throw error; // Re-try to the webhook knows that the proccess failed
    }
}