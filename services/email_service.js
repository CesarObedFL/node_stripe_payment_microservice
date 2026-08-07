import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL = process.env.EMAIL;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

if (!EMAIL || !EMAIL_PASSWORD) {
    console.warn('⚠️ EMAIL and EMAIL_PASSWORD not set. Email notifications disabled.');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL, pass: EMAIL_PASSWORD }
});

/**
 * Sends an email.
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @return {Promise<void>}
 */
export async function send_email(to, subject, htmlContent) {
    if (!EMAIL || !EMAIL_PASSWORD) {
        console.warn('⚠️ Email credentials missing. Skipping email.');
        return;
    }

    const mailOptions = {
        from: EMAIL,
        to,
        subject,
        html: `
            <html><body style="font-family: Arial, sans-serif; line-height: 1.6;">
                ${htmlContent}
                <hr>
                <small>Este mensaje es automático, por favor no responder.</small>
            </body></html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}`);
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
    }
}