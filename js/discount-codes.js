import supabase from './supabase.js';

export async function validateDiscountCode(code, cartTotal) {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid discount code' };
  }

  if (!data.is_active) {
    return { valid: false, error: 'This discount code is no longer active' };
  }

  const now = new Date();
  if (data.starts_at && new Date(data.starts_at) > now) {
    return { valid: false, error: 'This discount code is not yet active' };
  }
  if (data.expires_at && new Date(data.expires_at) < now) {
    return { valid: false, error: 'This discount code has expired' };
  }

  if (data.min_order_cents && cartTotal < data.min_order_cents) {
    const minAmount = (data.min_order_cents / 100).toFixed(2);
    return { valid: false, error: `Minimum order amount is S$${minAmount}` };
  }

  if (data.usage_limit && data.used_count >= data.usage_limit) {
    return { valid: false, error: 'This discount code has reached its usage limit' };
  }

  let discountAmount = 0;
  if (data.discount_type === 'percentage') {
    discountAmount = Math.round((cartTotal * data.discount_value) / 100);
  } else if (data.discount_type === 'fixed') {
    discountAmount = data.discount_value * 100;
  }

  const maxDiscount = data.max_discount_cents || Infinity;
  discountAmount = Math.min(discountAmount, maxDiscount);

  return {
    valid: true,
    discount: {
      code: data.code,
      type: data.discount_type,
      value: data.discount_value,
      discountAmount,
      description: data.description || `${data.discount_value}${data.discount_type === 'percentage' ? '%' : '.00'} off`
    }
  };
}

export async function recordDiscountUsage(code) {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('id, used_count')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) return;

  await supabase
    .from('discount_codes')
    .update({ used_count: (data.used_count || 0) + 1 })
    .eq('id', data.id);
}

export async function getAllDiscountCodes() {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createDiscountCode(codeData) {
  const { data, error } = await supabase
    .from('discount_codes')
    .insert([{
      code: codeData.code.toUpperCase(),
      discount_type: codeData.discount_type,
      discount_value: codeData.discount_value,
      min_order_cents: codeData.min_order_cents ? codeData.min_order_cents * 100 : null,
      max_discount_cents: codeData.max_discount_cents ? codeData.max_discount_cents * 100 : null,
      usage_limit: codeData.usage_limit || null,
      starts_at: codeData.starts_at || null,
      expires_at: codeData.expires_at || null,
      description: codeData.description || null,
      is_active: true
    }]);

  if (error) throw error;
  return data;
}

export async function updateDiscountCode(id, updates) {
  const updateData = { ...updates };
  if (updates.min_order_cents !== undefined) {
    updateData.min_order_cents = updates.min_order_cents ? updates.min_order_cents * 100 : null;
  }
  if (updates.max_discount_cents !== undefined) {
    updateData.max_discount_cents = updates.max_discount_cents ? updates.max_discount_cents * 100 : null;
  }

  const { data, error } = await supabase
    .from('discount_codes')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
  return data;
}

export async function deleteDiscountCode(id) {
  const { error } = await supabase
    .from('discount_codes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function validateDiscountCodeClient(code, cartTotal) {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid discount code' };
  }

  if (!data.is_active) {
    return { valid: false, error: 'This discount code is no longer active' };
  }

  const now = new Date();
  if (data.starts_at && new Date(data.starts_at) > now) {
    return { valid: false, error: 'This discount code is not yet active' };
  }
  if (data.expires_at && new Date(data.expires_at) < now) {
    return { valid: false, error: 'This discount code has expired' };
  }

  if (data.min_order_cents && cartTotal < data.min_order_cents) {
    const minAmount = (data.min_order_cents / 100).toFixed(2);
    return { valid: false, error: `Minimum order amount is S$${minAmount}` };
  }

  if (data.usage_limit && data.used_count >= data.usage_limit) {
    return { valid: false, error: 'This discount code has reached its usage limit' };
  }

  let discountAmount = 0;
  if (data.discount_type === 'percentage') {
    discountAmount = Math.round((cartTotal * data.discount_value) / 100);
  } else if (data.discount_type === 'fixed') {
    discountAmount = data.discount_value * 100;
  }

  const maxDiscount = data.max_discount_cents || Infinity;
  discountAmount = Math.min(discountAmount, maxDiscount);

  return {
    valid: true,
    discount: {
      code: data.code,
      type: data.discount_type,
      value: data.discount_value,
      discountAmount,
      description: data.description || `${data.discount_value}${data.discount_type === 'percentage' ? '%' : '.00'} off`
    }
  };
}