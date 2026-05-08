const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let session;
  try {
    const { items, customerEmail, customerName, shipping, discount, metadata } = JSON.parse(event.body);

    let unitAmount = items.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);
    let discountAmount = 0;

    if (discount && discount.code) {
      const { data: codeData, error: codeError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discount.code.toUpperCase())
        .single();

      if (!codeError && codeData && codeData.is_active) {
        if (codeData.discount_type === 'percentage') {
          discountAmount = Math.round((unitAmount * codeData.discount_value) / 100);
        } else if (codeData.discount_type === 'fixed') {
          discountAmount = codeData.discount_value * 100;
        }

        if (codeData.max_discount_cents) {
          discountAmount = Math.min(discountAmount, codeData.max_discount_cents);
        }
      }
    }

    const finalAmount = unitAmount - discountAmount;

    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${process.env.URL || 'https://verdant-kitsune-0d6b9d.netlify.app'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'https://verdant-kitsune-0d6b9d.netlify.app'}/checkout.html`,
      shipping_address_collection: {
        allowed_countries: ['SG', 'MY', 'ID', 'TH', 'VN', 'PH', 'US', 'GB', 'AU', 'JP'],
      },
      billing_address_collection: 'required',
      custom_text: {
        submit: { message: 'Your matcha will ship within 24 hours of order confirmation.' },
      },
      discounts: discountAmount > 0 ? [{
        coupon: await createStripeCoupon(discountAmount),
      }] : [],
      metadata: {
        customer_name: customerName,
        shipping_method: shipping?.method || '',
        shipping_carrier: shipping?.carrier || '',
        shipping_cost_cents: shipping?.cost_cents || 0,
        discount_code: discount?.code || '',
        discount_cents: discountAmount,
      },
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: session.id }) };
  } catch (err) {
    console.error('Stripe error:', err);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) };
  }
};

async function createStripeCoupon(discountAmount) {
  const coupon = await stripe.coupons.create({
    percent_off: 0,
    amount_off: discountAmount,
    currency: 'sgd',
    duration: 'once',
  });
  return coupon.id;
}