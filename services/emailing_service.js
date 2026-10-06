// services/emailing_service.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const EMAILING_MS_URL = process.env.EMAILING_MS_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generates a short-lived JWT for the emailing microservice.
 *
 * @returns {string} Signed JWT.
 */
function generate_email_token() {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign(
        { verified: true, type: 'email_verification' },
        JWT_SECRET,
        { expiresIn: '5m' }
    );
}

/**
 * Sends a transactional notification email via the emailing microservice.
 *
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} message - Email body (HTML string).
 * @returns {Promise<object>} Response from the emailing microservice.
 */
export async function send_email(to, subject, message) {
    if (!JWT_SECRET) {
        console.warn('⚠️ JWT_SECRET not set. Skipping email send.');
        return { skipped: true };
    }

    if (!to) {
        console.warn('⚠️ No recipient provided. Skipping email.');
        return { skipped: true };
    }

    const token = generate_email_token();

    const body = {
        to: to,
        subject: subject,
        message: message
    };

    try {
        const response = await fetch(`${EMAILING_MS_URL}/notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Emailing service error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        console.log(`📧 Email sent to ${to} via emailing microservice`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        throw error;
    }
}