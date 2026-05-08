import supabase from './supabase.js';

const SHIPPING_SGX_RATE_CENTS = 350;
const SHIPPING_SGX_EXPRESS_RATE_CENTS = 650;
const FREE_SHIPPING_THRESHOLD_CENTS = 6000;

export const SHIPPING_OPTIONS = {
  spx_standard: {
    id: 'spx_standard',
    name: 'SPX Express (Standard)',
    carrier: 'SPX Express',
    description: 'Singapore local delivery',
    rate_cents: SHIPPING_SGX_RATE_CENTS,
    estimated_days: '2-4 business days',
    available_countries: ['SG']
  },
  spx_express: {
    id: 'spx_express',
    name: 'SPX Express (Express)',
    carrier: 'SPX Express',
    description: 'Singapore express delivery',
    rate_cents: SHIPPING_SGX_EXPRESS_RATE_CENTS,
    estimated_days: '1-2 business days',
    available_countries: ['SG']
  },
  singpost_intl_economy: {
    id: 'singpost_intl_economy',
    name: 'SingPost International (Economy)',
    carrier: 'SingPost',
    description: 'International economy',
    rate_cents: 1200,
    estimated_days: '14-21 business days',
    available_countries: ['*']
  },
  singpost_intl_priority: {
    id: 'singpost_intl_priority',
    name: 'SingPost International (Priority)',
    carrier: 'SingPost',
    description: 'International priority',
    rate_cents: 2200,
    estimated_days: '7-12 business days',
    available_countries: ['*']
  },
  singpost_intl_registered: {
    id: 'singpost_intl_registered',
    name: 'SingPost International (Registered)',
    carrier: 'SingPost',
    description: 'International with tracking & insurance',
    rate_cents: 3500,
    estimated_days: '7-12 business days',
    available_countries: ['*']
  }
};

export function getAvailableShippingOptions(countryCode) {
  return Object.values(SHIPPING_OPTIONS).filter(option => {
    if (countryCode === 'SG') return true;
    return option.available_countries.includes('*');
  });
}

export function calculateShippingCost(optionId, cartSubtotal) {
  const option = SHIPPING_OPTIONS[optionId];
  if (!option) return 0;

  if (cartSubtotal >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return 0;
  }

  return option.rate_cents;
}

export function isFreeShippingAvailable(cartSubtotal) {
  return cartSubtotal >= FREE_SHIPPING_THRESHOLD_CENTS;
}

export function formatShippingRate(cents) {
  if (cents === 0) return 'FREE';
  return 'S$' + (cents / 100).toFixed(2);
}

export function getShippingOption(optionId) {
  return SHIPPING_OPTIONS[optionId] || null;
}

export async function createSPXShipment(orderData) {
  const apiKey = localStorage.getItem('spx_api_key');
  if (!apiKey) {
    return { success: false, error: 'SPX API key not configured' };
  }

  try {
    const response = await fetch('https://api.spx.example.com/v1/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        service_type: orderData.is_express ? 'EXPRESS' : 'STANDARD',
        recipient_name: orderData.recipient_name,
        recipient_phone: orderData.recipient_phone,
        recipient_email: orderData.recipient_email,
        address_line1: orderData.address_line1,
        address_line2: orderData.address_line2 || '',
        postal_code: orderData.postal_code,
        country: orderData.country || 'SG',
        parcel_contents: orderData.items.map(item => ({
          description: item.name,
          quantity: item.qty,
          weight_kg: 0.2,
          value_sgd: item.price
        })),
        order_reference: orderData.order_reference
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'SPX shipment creation failed' };
    }

    const data = await response.json();
    return { success: true, tracking_number: data.tracking_number, label_url: data.label_url };
  } catch (err) {
    return { success: false, error: 'Failed to connect to SPX API' };
  }
}

export async function createSingpostShipment(orderData) {
  const apiKey = localStorage.getItem('singpost_api_key');
  if (!apiKey) {
    return { success: false, error: 'SingPost API key not configured' };
  }

  try {
    const serviceType = orderData.service_type || 'INTERNATIONAL_ECONOMY';
    const isRegistered = orderData.service_type === 'INTERNATIONAL_REGISTERED';

    const payload = {
      from_country: 'SG',
      from_postal_code: '123456',
      to_country: orderData.country,
      to_postal_code: orderData.postal_code,
      weight_kg: 0.3,
      service_type: serviceType,
      contents: orderData.items.map(item => ({
        description: item.name,
        quantity: item.qty,
        value_sgd: item.price
      })),
      is_registered: isRegistered,
      order_reference: orderData.order_reference
    };

    const response = await fetch('https://api.singpost.com/v1/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'SingPost shipment creation failed' };
    }

    const data = await response.json();
    return {
      success: true,
      tracking_number: data.tracking_number,
      label_url: data.label_url,
      insurance_enabled: isRegistered
    };
  } catch (err) {
    return { success: false, error: 'Failed to connect to SingPost API' };
  }
}

export async function fetchTrackingInfo(carrier, trackingNumber) {
  if (carrier === 'SPX Express') {
    return await fetchSPXTracking(trackingNumber);
  } else if (carrier === 'SingPost') {
    return await fetchSingpostTracking(trackingNumber);
  }
  return { success: false, error: 'Unknown carrier' };
}

async function fetchSPXTracking(trackingNumber) {
  const apiKey = localStorage.getItem('spx_api_key');
  if (!apiKey) {
    return { success: false, error: 'SPX API key not configured' };
  }

  try {
    const response = await fetch(`https://api.spx.example.com/v1/shipments/${trackingNumber}/track`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      return { success: false, error: 'Unable to fetch tracking information' };
    }

    const data = await response.json();
    return {
      success: true,
      status: data.status,
      estimated_delivery: data.estimated_delivery,
      events: data.events || []
    };
  } catch {
    return { success: false, error: 'Failed to connect to SPX tracking API' };
  }
}

async function fetchSingpostTracking(trackingNumber) {
  const apiKey = localStorage.getItem('singpost_api_key');
  if (!apiKey) {
    return { success: false, error: 'SingPost API key not configured' };
  }

  try {
    const response = await fetch(`https://api.singpost.com/v1/tracking/${trackingNumber}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      return { success: false, error: 'Unable to fetch tracking information' };
    }

    const data = await response.json();
    return {
      success: true,
      status: data.status,
      estimated_delivery: data.estimated_delivery,
      events: data.events || []
    };
  } catch {
    return { success: false, error: 'Failed to connect to SingPost tracking API' };
  }
}

export function formatTrackingEvents(events) {
  if (!events || events.length === 0) return '';
  return events.map(event => {
    const date = new Date(event.timestamp);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr} - ${event.description}`;
  }).join('\n');
}