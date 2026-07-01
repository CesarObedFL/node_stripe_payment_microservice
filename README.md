# Payment Microservice with Stripe 🚀

[![Node.js Version](https://img.shields.io/badge/node.js-18.x-green)](https://nodejs.org/)
[![Stripe Version](https://img.shields.io/badge/stripe-latest-blue)](https://stripe.com/)

## 📖 Description

This microservice, built with **Node.js** and **Express**, acts as a generic and secure payment backend for **Stripe**. Its purpose is to be the middle layer between your frontend applications (like Vue.js) and the Stripe API, centralizing all payment logic.

**Main Features:**
* **Parameterizable:** A single endpoint (`/create-payment-intent`) that accepts dynamic data to handle different services, products, or subscriptions.

[reference:0] * **Secure:** Centralizes the use of your **Stripe secret key**, which is never exposed to the frontend.

* **Scalable:** Designed as a standalone microservice that can be deployed and scaled independently[reference:1].

* **Extensible:** Easily extendable to support new use cases or even other payment gateways[reference:2].

## 🚀 Getting Started

### Prerequisites

* Node.js (version 18.x or higher)
* npm or yarn
* A Stripe account and your API keys (publishable and secret)

### Installation and Configuration

1. Clone the repository:

``bash

git clone https://github.com/your-username/your-repository.git

cd your-repository