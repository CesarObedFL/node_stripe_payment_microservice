import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import payment_routes from './routes/payment_routes.js';
import handle_webhook from './webhooks/webhook_handler.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ============ MIDDLEWARE ============

/**
 * Enable CORS for the frontend origin.
 */
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Webhook endpoint must receive raw body for signature verification.
 * This route must be defined before express.json() middleware.
 */
app.post('/webhook', express.raw({ type: 'application/json' }), handle_webhook);

/**
 * Parse JSON for all other routes.
 */
app.use(express.json());

// ============ ROUTES ============

app.use('/api/payments', payment_routes);

/**
 * Health check endpoint.
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`✅ Payment microservice running on http://localhost:${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
});