# Payment Microservice with Stripe

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Stripe](https://img.shields.io/badge/Stripe-API-blue)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![MIT License](https://img.shields.io/badge/License-MIT-yellow)

A configurable and scalable microservice to securely integrate payments with **Stripe** from your backend. It acts as an intermediate layer between your frontend and the Stripe API, centralising payment logic and keeping your credentials protected.
This solution is a personal solution, a personal microservice, but it can be replicable and configured for a standard solution for you, only copy and replace the concerning parts...

## 📖 Description

This microservice, built with **Node.js** and **Express**, acts as a generic and secure payment backend for **Stripe**. Its purpose is to be the middle layer between your frontend applications (like Vue.js) and the Stripe API, centralizing all payment logic.
This personal solution uses mi Storage microservice: [storage-microservice], to save safetly the info of the transactions and uses gmail to emailed to client and admin about the payment status

## 🚀 Features

- **Single endpoint** to create PaymentIntents (`/create-payment-intent`), parametrisable for different services and products.
- **Security**: the Stripe secret key is never exposed to the client.
- **Integrated webhooks** to handle Stripe events (`payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`).
- **Email notifications** to the customer and administrator via Nodemailer.
- **Data persistence**: saves payment records to an external storage microservice.
- **Integration tests** with Vitest and Supertest.
- **CI/CD** with GitHub Actions (automatic tests on every push).
- **Containerisation** with Docker and Docker Compose.
- **Easy configuration** via environment variables.

[reference:0] * **Secure:** Centralizes the use of your **Stripe secret key**, which is never exposed to the frontend.

* **Scalable:** Designed as a standalone microservice that can be deployed and scaled independently[reference:1].

* **Extensible:** Easily extendable to support new use cases or even other payment gateways[reference:2].

## 🚀 Getting Started

## 📋 Prerequisites

- **Node.js** v18 or higher
- **pnpm** (recommended), **npm** or **yarn**
- A **Stripe** account with your API keys ([Stripe Dashboard](https://dashboard.stripe.com/))

## 🔧 Installation

```bash
# Clone the repository
git clone repo_url
cd node_stripe_payment_microservice

# Install dependencies (with pnpm)
pnpm install

# Create environment file from example
cp .env.example .env

# Edit .env with your credentials (see next section)
nano .env

# Start in development mode
pnpm run dev
The server will be available at http://localhost:3200 (or the port you defined).
```

## 🌐 Configuration

Environment Variables
Create a .env file in the root with the following variables. All are required except those marked as optional.

| Variable | Description | Required |
| ---- | ----------- | ------------ |
| PORT | Port on which the server will run (e.g. 3200). | Yes |
| CLIENT URL | Frontend URL allowed by CORS (e.g. http://localhost:5173). | Yes |
| STRIPE SECRET KEY | Stripe secret key (test or live mode). | Yes |
| STRIPE WEBHOOK SECRET | Webhook signing secret. | No (for local testing with Stripe CLI) |
| EMAIL | Email address used by the sending service. | No (if you don't use email) |
| EMAIL PASSWORD | App password (for Gmail). | No |
| ADMIN EMAIL | Administrator email (receives notifications). | No | 
| STORAGE MS URL | Storage microservice URL (e.g. http://localhost:4000). | No |
| STORAGE TOKEN | Authentication token for the payments project. | No |


**Note**: For Gmail, generate an app password at https://myaccount.google.com/apppasswords.


## 🔌 API Endpoints
| Method | Route | Description | Body (JSON) | Success Response | Error Codes |
| POST | /api/payments/create-payment-intent | Creates a PaymentIntent for a plan. | { "plan_id": "freelance_basic", "customer_email": "client@mail.com", "metadata": {} } | 201 with clientSecret, paymentIntentId, amount, currency, plan. | 400 (missing or invalid plan), 500 (internal error) |
| GET | /api/payments/payment-intent/:id | Retrieves the status of a PaymentIntent. | (URL param) | 200 with id, status, clientSecret, etc. | 400 (missing ID), 500 (internal error) |
| POST | /webhook | Endpoint to receive Stripe events. | (Stripe raw body, consult the official docs [stripe-docs]) | 200 { received: true } | 400 (invalid signature) |
| GET | /health | Health check.	| - | 200 { status: "OK", timestamp: ... } | - |

**Available Plans (for plan_id) in this repo**

This is only for my porfolio, if you want to chage them, you have to create the plans in the Stripe platform one by one and replace the payment_controller.js with yours...

| Plan ID | Description | Total Price (USD) |
| ----- | ------ | ----- |
| freelance_basic | Freelance - Basic | $116.00 |
| freelance_standard | Freelance - Standard | $290.00 |
| freelance_premium | Freelance - Premium | $464.00 |
| maintenance_basic | Maintenance - Basic | $81.20 |
| maintenance_specialized | Maintenance - Specialized | $174.00 |
| maintenance_custom | Maintenance - Custom (per hour) | $23.20/hr |



## 📡 Webhooks
The microservice handles three Stripe events:

| Event | Action |
| ----- | ----- |
| payment_intent.succeeded | Saves the payment, sends confirmation to customer and notifies admin. |
| payment_intent.payment_failed | Sends failure notice to customer and notifies admin with reason. |
| charge.refunded | Sends refund notice to customer and notifies admin. |

To test locally with Stripe CLI:
```
bash
stripe listen --forward-to localhost:3200/webhook
```

Then trigger events with:
```
bash
stripe trigger payment_intent.succeeded --add payment_intent:receipt_email=client@test.com
```

For production, configure the webhook in the Stripe Dashboard with your server's public URL (e.g. https://yourdomain.com/webhook).

## 🧪 Testing
Integration Tests
```
bash
pnpm run test:integration
```
Runs all tests that verify the main endpoint (/create-payment-intent) behaviour, including:
- Successful PaymentIntent creation.
- Rejection of invalid plan_id.
- Acceptance of valid plan_id without email.
- Return of the correct amount according to the plan.

# CI/CD Configuration
The repository includes a GitHub Actions workflow (.github/workflows/ci.yml) that:

- pnpm install --prefer-frozen-lockfile --ignore-workspace

Runs integration tests.

Triggers on pushes to main/develop and on pull requests.

## 🐳 Deployment with Docker

Using Docker Compose
```
bash
docker-compose up -d
```
Manual Build
```
bash
docker build -t payment-microservice .
docker run -p 3200:3200 --env-file .env payment-microservice
```
The Dockerfile and docker-compose.yml are ready to use.

## 🤖 CI/CD with GitHub Actions
The file .github/workflows/ci.yml uses pnpm and requires the following secrets in the repository:

| Secret | Description |
| ----- | ----- |
| STRIPE_SECRET_KEY | Stripe secret key (required). |
| STRIPE_WEBHOOK_SECRET | Webhook secret (optional). |
| EMAIL | Email for sending (optional). |
| EMAIL_PASSWORD | App password (optional). |
| ADMIN_EMAIL | Admin email (optional). |
| STORAGE_MS_URL | Storage URL (optional). |
| STORAGE_TOKEN | Storage token (optional). |


## 🛠️ Technologies Used
Node.js + Express – Web server.
Stripe Node.js SDK – Stripe integration.
Vitest + Supertest – Testing.
pnpm – Fast and efficient package manager.
Docker – Containerisation.
GitHub Actions – CI/CD.

## 🤝 Contributing
Contributions are welcome! Please follow these steps:
- Fork the project.
- Create a branch for your feature (git checkout -b feature/new-feature).
- Make your changes and ensure tests pass.
- Commit and push (git commit -m 'Add new feature').
- Open a Pull Request describing your changes.

## ☕ Support & Donations
If this project has been useful to you, consider supporting me to continue developing and maintaining this and other open-source projects.
You can buy me a coffee to keep it going!

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/lato-orange.png)](https://buymeacoffee.com/cesarobedfl)

<b>Follow me! </b> <br>
<p align="left">
    <a href="https://github.com/CesarObedFL">
        <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
    </a>
    <a href="https://www.linkedin.com/in/cesarobedfigueroaluna/">
        <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
    </a>
</p>


Any contribution is greatly appreciated! 🙌



## 📄 `LICENSE` (MIT)
This project is licensed under the MIT License. See the LICENSE file for details.

Made with ❤️ by CesarObedFL



[stripe-docs]: <https://docs.stripe.com/>
[storage-microservice]: <https://github.com/CesarObedFL/node_storage_microservice>
