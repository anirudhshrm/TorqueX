const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe webhook handler - parse body as raw buffer
router.post('/stripe', (req, res, next) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
}, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.sendStatus(400);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        console.log('Booking ID:', paymentIntent.metadata.bookingId);
        // Handle successful payment
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        console.log('Payment failed:', failedIntent.id);
        // Handle failed payment
        break;

      case 'charge.refunded':
        const refundedCharge = event.data.object;
        console.log('Charge refunded:', refundedCharge.id);
        // Handle refund
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

module.exports = router;
