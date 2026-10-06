const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
    apps: [
        {
            name: 'payment_microservice',
            script: './server.js',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            env: {
                NODE_ENV: 'production',
                PORT: process.env.PORT,
                CLIENT_URL: process.env.CLIENT_URL,
                STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
                STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
                ADMIN_EMAIL: process.env.ADMIN_EMAIL,
                EMAILING_MS_URL: process.env.EMAILING_MS_URL,
                JWT_SECRET: process.env.JWT_SECRET,
                STORAGE_MS_URL: process.env.STORAGE_MS_URL,
                STORAGE_TOKEN: process.env.STORAGE_TOKEN,
                STORAGE_PROJECT: process.env.STORAGE_PROJECT,
                STORAGE_FILE: process.env.STORAGE_FILE
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 5000
        }
    ]
};