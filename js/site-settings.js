import supabase from './supabase.js';

export const DEFAULT_SCHEME = {
  'deep-ebony':    '#1A1108',
  'rich-espresso': '#2C1A0E',
  'antique-gold':  '#C9933A',
  'aged-brass':    '#A67C3A',
  'warm-cream':    '#F5ECD7',
  'muted-gold':    '#F0D9A8',
  'matcha':        '#4A7A3F',
  'matcha-bright': '#6DA85E',
  'matcha-deep':   '#1E3A1F',
  'card-bg-solid': '#221508',
};

export const PRESET_SCHEMES = [
  {
    id: 'default',
    name: 'Original (Warm Gold)',
    description: 'The original eebecco palette — warm ebony, antique gold, and matcha green.',
    colors: { ...DEFAULT_SCHEME },
  },
  {
    id: 'dark-matcha',
    name: 'Deep Matcha',
    description: 'Deep forest greens with subtle gold accents. Earthy and grounding.',
    colors: {
      'deep-ebony':    '#0D1E0E',
      'rich-espresso': '#1A2E1A',
      'antique-gold':  '#B8933A',
      'aged-brass':    '#9A7A30',
      'warm-cream':    '#E5F0D7',
      'muted-gold':    '#D0D9A8',
      'matcha':        '#5A8A4F',
      'matcha-bright': '#7DBF6E',
      'matcha-deep':   '#0D2E0F',
      'card-bg-solid': '#142815',
    },
  },
  {
    id: 'charcoal-gold',
    name: 'Charcoal & Gold',
    description: 'Sleek charcoal base with striking gold highlights. Modern and refined.',
    colors: {
      'deep-ebony':    '#1A1A1A',
      'rich-espresso': '#2A2A2A',
      'antique-gold':  '#D4A54A',
      'aged-brass':    '#B08A3A',
      'warm-cream':    '#E8E0D0',
      'muted-gold':    '#D0C8A0',
      'matcha':        '#5A7A4F',
      'matcha-bright': '#7AAA6E',
      'matcha-deep':   '#1A2A1A',
      'card-bg-solid': '#222222',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura Rose',
    description: 'Warm rose gold tones on deep mauve. Delicate and elegant.',
    colors: {
      'deep-ebony':    '#1A0D12',
      'rich-espresso': '#2A141C',
      'antique-gold':  '#D4A5A5',
      'aged-brass':    '#B88A8A',
      'warm-cream':    '#F0E0E0',
      'muted-gold':    '#D8C0C0',
      'matcha':        '#7A6A6A',
      'matcha-bright': '#A08A8A',
      'matcha-deep':   '#2A1A1A',
      'card-bg-solid': '#221418',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    description: 'Deep navy base with cool silver-gold accents. Calm and premium.',
    colors: {
      'deep-ebony':    '#0A0E1A',
      'rich-espresso': '#141A2A',
      'antique-gold':  '#A8B8D4',
      'aged-brass':    '#8A9AB8',
      'warm-cream':    '#D0D8E8',
      'muted-gold':    '#B0C0D8',
      'matcha':        '#4A6A7A',
      'matcha-bright': '#6A8AAA',
      'matcha-deep':   '#0E1A2A',
      'card-bg-solid': '#141822',
    },
  },
  {
    id: 'terra',
    name: 'Terra Cotta',
    description: 'Earthy clay and terracotta tones. Warm, rustic, and inviting.',
    colors: {
      'deep-ebony':    '#1A1208',
      'rich-espresso': '#2A1C10',
      'antique-gold':  '#D4A060',
      'aged-brass':    '#B88440',
      'warm-cream':    '#F0E0C8',
      'muted-gold':    '#D8C8A8',
      'matcha':        '#6A7A4A',
      'matcha-bright': '#8AAA6A',
      'matcha-deep':   '#1A2A10',
      'card-bg-solid': '#221610',
    },
  },
];

export async function loadActiveScheme() {
  const STORAGE_KEY = 'eebecco_scheme';
  const cached = sessionStorage.getItem(STORAGE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'color_scheme')
    .single();

  if (error || !data) return { id: 'default', ...DEFAULT_SCHEME };

  const scheme = data.value;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scheme));
  return scheme;
}

export function applyScheme(scheme) {
  const root = document.documentElement;
  const colors = scheme.colors || scheme;
  Object.entries(colors).forEach(([key, val]) => {
    root.style.setProperty(`--${key}`, val);
  });
}

export function resetScheme() {
  applyScheme({ colors: DEFAULT_SCHEME });
  sessionStorage.removeItem('eebecco_scheme');
}

export const DEFAULT_HEADER = {
  logo_url: 'logo.jpg',
  logo_height: 36,
};

export async function loadHeaderSettings() {
  const STORAGE_KEY = 'eebecco_header';
  const cached = sessionStorage.getItem(STORAGE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'header_settings')
    .single();

  if (error || !data) return { ...DEFAULT_HEADER };

  const settings = { ...DEFAULT_HEADER, ...data.value };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  return settings;
}

export function applyHeaderSettings(settings) {
  const s = settings || DEFAULT_HEADER;
  document.querySelectorAll('.header-logo img, .footer-brand .header-logo img').forEach(img => {
    if (s.logo_url) img.src = s.logo_url;
    if (s.logo_height) img.style.height = s.logo_height + 'px';
  });
}
