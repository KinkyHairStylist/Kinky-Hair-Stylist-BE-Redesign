// One-off bootstrap: creates a Stripe Product + recurring monthly Price for
// each merchant subscription tier, then prints the resulting Price IDs for
// an admin to paste into Platform Settings (payments.subscriptionPrices).
// Run once per Stripe account (test mode and live mode separately).
import * as dotenv from 'dotenv';
dotenv.config();
import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('STRIPE_SECRET_KEY must be set');
  process.exit(1);
}
const stripe = new Stripe(secretKey);

const TIERS: { name: 'Starter' | 'Growth' | 'Pro'; amountCents: number }[] = [
  { name: 'Starter', amountCents: 2999 },
  { name: 'Growth', amountCents: 5999 },
  { name: 'Pro', amountCents: 9999 },
];

async function run() {
  const results: Record<string, string> = {};

  for (const tier of TIERS) {
    const product = await stripe.products.create({
      name: `KHS Merchant Subscription — ${tier.name}`,
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.amountCents,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    results[tier.name] = price.id;
    console.log(`${tier.name}: product=${product.id} price=${price.id} ($${(tier.amountCents / 100).toFixed(2)}/mo)`);
  }

  console.log('\nPaste these into Platform Settings > Payments > subscriptionPrices:');
  console.log(JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
