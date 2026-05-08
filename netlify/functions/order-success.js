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
    const { session_id } = JSON.parse(event.body);

    if (!session_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Session ID required' }) };
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'customer']
    });

    if (!session || session.payment_status !== 'paid') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Payment not completed' }) };
    }

    const existingOrder = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session_id)
      .single();

    if (existingOrder.data) {
      return { statusCode: 200, body: JSON.stringify({ success: true, order_id: existingOrder.data.id, message: 'Order already exists' }) };
    }

    const userId = session.metadata?.user_id || null;
    const customerEmail = session.customer_email || session.customer?.email || '';
    const customerName = session.metadata?.customer_name || '';
    const shippingCarrier = session.metadata?.shipping_carrier || '';
    const shippingMethod = session.metadata?.shipping_method || '';
    const shippingCostCents = parseInt(session.metadata?.shipping_cost_cents || '0');
    const discountCode = session.metadata?.discount_code || '';
    const discountCents = parseInt(session.metadata?.discount_cents || '0');

    const subtotal = session.line_items.data.reduce((sum, item) => {
      return sum + (item.amount_unit || 0) * (item.quantity || 1);
    }, 0);

    const totalCents = subtotal - discountCents + shippingCostCents;

    const orderItems = session.line_items.data.map(item => ({
      product_name: item.description || 'Unknown Product',
      quantity: item.quantity || 1,
      unit_price_cents: item.amount_unit || 0,
    }));

    const shippingData = {
      carrier: shippingCarrier,
      method: shippingMethod,
      cost_cents: shippingCostCents,
      address: {
        line1: session.shipping_details?.address?.line1 || '',
        line2: session.shipping_details?.address?.line2 || '',
        city: session.shipping_details?.address?.city || '',
        postal: session.shipping_details?.address?.postal_code || '',
        country: session.shipping_details?.address?.country || '',
      },
      recipient_name: session.shipping_details?.name || customerName,
      recipient_phone: session.shipping_details?.phone || '',
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        email: customerEmail,
        customer_name: customerName,
        status: 'paid',
        subtotal_cents: subtotal,
        shipping_cents: shippingCostCents,
        discount_cents: discountCents,
        discount_code: discountCode,
        total_cents: totalCents,
        shipping_data: shippingData,
        stripe_session_id: session_id,
        order_items: orderItems,
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save order: ' + orderError.message }) };
    }

    if (discountCode) {
      await supabase.rpc('increment_discount_usage', { code: discountCode.toUpperCase() }).catch(() => {});
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, order_id: order.id }) };
  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) };
  }
};