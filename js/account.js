import supabase from './supabase.js';

export async function getPurchaseHistory(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getOrder(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
}

export async function getMailingListStatus(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('mailing_list_opt_in, mailing_list_subscribed_at')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || { mailing_list_opt_in: false, mailing_list_subscribed_at: null };
}

export async function toggleMailingList(userId, optIn) {
  const updates = optIn
    ? {
        mailing_list_opt_in: true,
        mailing_list_subscribed_at: new Date().toISOString()
      }
    : {
        mailing_list_opt_in: false,
        mailing_list_subscribed_at: null
      };

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}

export async function getShippingAddress(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('shipping_address')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.shipping_address || null;
}

export async function saveShippingAddress(userId, address) {
  const { error } = await supabase
    .from('profiles')
    .update({ shipping_address: address })
    .eq('id', userId);

  if (error) throw error;
}

export async function updateOrderStatus(orderId, status, trackingNumber = null, carrier = null) {
  const updates = { status };
  if (trackingNumber) updates.tracking_number = trackingNumber;
  if (carrier) updates.carrier = carrier;

  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId);

  if (error) throw error;
}

export async function getAllOrders(limit = 50) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getPendingOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'paid')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function formatOrderDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

export function getStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    paid: 'Paid - Awaiting Shipment',
    confirmed: 'Confirmed - Preparing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded'
  };
  return labels[status] || status;
}