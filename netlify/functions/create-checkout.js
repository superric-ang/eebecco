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

  try {
    const { items, customerEmail, customerName, shipping, discount, metadata } = JSON.parse(event.body);

    let unitAmount = items.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);
    let discountAmount = 0;

    if (discount && discount.code) {
      const { data: codeData } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discount.code.toUpperCase())
        .single();

      if (codeData && codeData.is_active) {
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

    const shippingCost = shipping?.cost_cents || 0;
    const finalAmount = unitAmount - discountAmount + shippingCost;

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: items,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${process.env.SITE_URL || 'https://eebecco.netlify.app'}/success.html?session_id={CHECKOUT_SESSION_ID}&order_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL || 'https://eebecco.netlify.app'}/checkout.html`,
      shipping_address_collection: {
        allowed_countries: ['SG', 'MY', 'ID', 'TH', 'VN', 'PH', 'US', 'GB', 'AU', 'JP', 'HK', 'TW', 'KR', 'CN'],
      },
      billing_address_collection: 'required',
      metadata: {
        customer_name: customerName,
        shipping_method: shipping?.method || '',
        shipping_carrier: shipping?.carrier || '',
        shipping_cost_cents: shippingCost,
        discount_code: discount?.code || '',
        discount_cents: discountAmount,
      },
    };

    if (discountAmount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: discountAmount,
        currency: 'sgd',
        duration: 'once',
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: session.id }) };
  } catch (err) {
    console.error('Stripe error:', err);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) };
  }
};