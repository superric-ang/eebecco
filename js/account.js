import supabase from './supabase.js';

export async function getPurchaseHistory(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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

export async function getOrderItems(orderId) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('id', { ascending: true });

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
    paid: 'Paid',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded'
  };
  return labels[status] || status;
}