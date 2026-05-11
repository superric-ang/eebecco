import supabase from './supabase.js';

export async function loadPageContent(slug) {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;
  return data;
}

export function renderPageContent(elements, container) {
  if (!elements || !elements.length) return;

  container.innerHTML = elements.map((el, i) => {
    const delay = Math.min(i, 5);
    const revealClass = `reveal${delay > 0 ? ` reveal-delay-${delay}` : ''}`;
    return renderElement(el, revealClass);
  }).join('');

  if (typeof window.revealElements === 'function') {
    window.revealElements();
  }
}

function renderElement(el, revealClass) {
  switch (el.type) {
    case 'page-header': return renderPageHeader(el.data, revealClass);
    case 'section-header': return renderSectionHeader(el.data, revealClass);
    case 'content-block': return renderContentBlock(el.data, revealClass);
    case 'heading': return renderHeading(el.data, revealClass);
    case 'text': return renderText(el.data, revealClass);
    case 'image': return renderImage(el.data, revealClass);
    case 'video': return renderVideo(el.data, revealClass);
    case 'button': return renderButton(el.data, revealClass);
    case 'card': return renderCard(el.data, revealClass);
    case 'columns': return renderColumns(el.data, revealClass);
    case 'stats': return renderStats(el.data, revealClass);
    case 'two-column': return renderTwoColumn(el.data, revealClass);
    case 'divider': return renderDivider(el.data, revealClass);
    case 'spacer': return renderSpacer(el.data);
    case 'html': return renderHtml(el.data, revealClass);
    default: return '';
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toEmbedUrl(url) {
  if (!url) return '';
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const yts = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  if (yts) return `https://www.youtube.com/embed/${yts[1]}`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com')) return url;
  return url;
}

function renderPageHeader(data, revealClass) {
  const bg = data.background_url ? ` style="background-image:url('${escHtml(data.background_url)}');"` : '';
  return `<section class="page-header">
    <div class="page-header-bg"${bg}></div>
    <div class="container" style="position:relative; z-index:2;">
      ${data.eyebrow ? `<span class="section-eyebrow ${revealClass}">${escHtml(data.eyebrow)}</span>` : ''}
      <h1 class="section-title ${revealClass}">${data.title || ''}</h1>
      <div class="gold-divider centered ${revealClass}">
        <div class="gold-divider-line"></div>
        <div class="gold-divider-ornament">${data.ornament || '◆'}</div>
        <div class="gold-divider-line"></div>
      </div>
      ${data.subtitle ? `<p class="section-subtitle ${revealClass}">${escHtml(data.subtitle)}</p>` : ''}
    </div>
  </section>`;
}

function renderSectionHeader(data, revealClass) {
  return `<div style="margin-bottom:2.5rem;">
    ${data.eyebrow ? `<span class="section-eyebrow ${revealClass}">${escHtml(data.eyebrow)}</span>` : ''}
    <h2 class="section-title ${revealClass}" style="font-size:clamp(1.6rem,3vw,2.2rem);">${data.title || ''}</h2>
    <div class="gold-divider centered ${revealClass}">
      <div class="gold-divider-line"></div>
      <div class="gold-divider-ornament">${data.ornament || '◆'}</div>
      <div class="gold-divider-line"></div>
    </div>
    ${data.subtitle ? `<p class="section-subtitle ${revealClass}">${escHtml(data.subtitle)}</p>` : ''}
  </div>`;
}

function renderContentBlock(data, revealClass) {
  return `<div class="${revealClass}" style="margin-bottom:2rem;">
    ${data.heading ? `<h2 style="font-family:var(--font-display); font-size:1.5rem; font-weight:600; color:var(--white); margin-bottom:1rem;">${escHtml(data.heading)}</h2>` : ''}
    ${(data.content || '').split('\n').filter(p => p.trim()).map(p =>
      `<p style="font-size:0.92rem; color:rgba(245,236,215,0.55); line-height:1.8; margin-bottom:0.75rem;">${escHtml(p)}</p>`
    ).join('')}
    ${data.list_items ? `<ul style="list-style:none; padding:0; margin:1rem 0;">${data.list_items.map(i =>
      `<li style="padding:0.4rem 0; padding-left:1.5rem; position:relative; font-size:0.88rem; color:rgba(245,236,215,0.55);"><span style="position:absolute; left:0; color:var(--antique-gold);">${data.list_bullet || '◆'}</span>${escHtml(i)}</li>`
    ).join('')}</ul>` : ''}
  </div>`;
}

function renderHeading(data, revealClass) {
  const level = data.level || 'h2';
  return `<${level} class="${revealClass}" style="font-family:var(--font-display); font-weight:600; color:var(--white); line-height:1.15; margin-bottom:1rem;">${escHtml(data.text || '')}</${level}>`;
}

function renderText(data, revealClass) {
  const paragraphs = (data.content || '').split('\n').filter(p => p.trim());
  return paragraphs.map(p =>
    `<p class="${revealClass}" style="font-size:0.92rem; color:rgba(245,236,215,0.55); line-height:1.8; margin-bottom:1rem;">${escHtml(p)}</p>`
  ).join('');
}

function renderImage(data, revealClass) {
  if (!data.url) return '';
  return `<figure class="${revealClass}" style="margin:1.5rem 0;">
    <img src="${escHtml(data.url)}" alt="${escHtml(data.alt || '')}" style="max-width:100%; border-radius:8px; border:1px solid var(--gold-border);">
    ${data.caption ? `<figcaption style="font-size:0.78rem; color:rgba(245,236,215,0.4); margin-top:0.5rem; font-style:italic; text-align:center;">${escHtml(data.caption)}</figcaption>` : ''}
  </figure>`;
}

function renderVideo(data, revealClass) {
  const embed = toEmbedUrl(data.url || '');
  if (!embed) return '';
  return `<div class="${revealClass}" style="margin:1.5rem 0; position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:8px; border:1px solid var(--gold-border);">
    <iframe src="${escHtml(embed)}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;" allowfullscreen loading="lazy"></iframe>
  </div>`;
}

function renderButton(data, revealClass) {
  if (!data.url || data.url === '#') return '';
  const align = data.align || 'left';
  const style = data.style || 'primary';
  const cls = style === 'primary' ? 'btn btn-primary' : style === 'secondary' ? 'btn btn-ghost' : 'btn btn-ghost';
  return `<div class="${revealClass}" style="text-align:${align}; margin:1rem 0;">
    <a href="${escHtml(data.url)}" class="${cls}" style="display:inline-flex; font-size:0.7rem; padding:0.7rem 1.5rem; text-decoration:none;">${escHtml(data.label || 'Button')}</a>
  </div>`;
}

function renderCard(data, revealClass) {
  const icon = data.icon || '';
  return `<div class="${revealClass}" style="background:var(--card-bg-solid); border:1px solid var(--gold-border); padding:1.25rem; border-radius:8px; position:relative; margin-bottom:1rem;">
    <div style="position:absolute; top:6px; left:6px; right:6px; bottom:6px; border:1px solid rgba(201,147,58,0.1); pointer-events:none;"></div>
    ${icon ? `<div style="font-size:1.5rem; margin-bottom:0.5rem;">${icon}</div>` : ''}
    ${data.title ? `<h3 style="font-family:var(--font-display); font-size:1rem; font-weight:600; color:var(--white); margin-bottom:0.4rem;">${escHtml(data.title)}</h3>` : ''}
    ${data.description ? `<p style="font-size:0.85rem; color:rgba(245,236,215,0.55); line-height:1.6; margin:0;">${escHtml(data.description)}</p>` : ''}
    ${data.japanese ? `<p style="font-family:var(--font-jp); font-size:0.75rem; color:var(--antique-gold); margin-top:0.3rem;">${escHtml(data.japanese)}</p>` : ''}
    ${data.link_url ? `<a href="${escHtml(data.link_url)}" style="font-size:0.75rem; color:var(--antique-gold); margin-top:0.5rem; display:inline-block;">${escHtml(data.link_text || 'Learn More')} →</a>` : ''}
  </div>`;
}

function renderColumns(data, revealClass) {
  const count = parseInt(data.count) || 2;
  const items = Array.isArray(data.items) ? data.items : Array(count).fill('');
  return `<div class="${revealClass}" style="display:grid; grid-template-columns:repeat(${count},1fr); gap:1.5rem; margin:1.5rem 0;">
    ${items.slice(0, count).map((text, i) =>
      `<div style="background:var(--card-bg-solid); border:1px solid var(--gold-border); padding:1.25rem; border-radius:8px; position:relative;">
        <div style="position:absolute; top:6px; left:6px; right:6px; bottom:6px; border:1px solid rgba(201,147,58,0.1); pointer-events:none;"></div>
        <p style="font-size:0.88rem; color:rgba(245,236,215,0.55); line-height:1.7; margin:0;">${escHtml(text || '')}</p>
      </div>`
    ).join('')}
  </div>`;
}

function renderStats(data, revealClass) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (!items.length) return '';
  return `<div class="${revealClass}" style="display:grid; grid-template-columns:repeat(${Math.min(items.length, 4)},1fr); gap:1.5rem; margin:2rem 0; text-align:center;">
    ${items.map(item => `
      <div>
        <div style="font-family:var(--font-display); font-size:2.2rem; font-weight:600; color:var(--antique-gold); line-height:1;">${escHtml(item.number || '')}</div>
        <div style="font-family:var(--font-label); font-size:0.65rem; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:rgba(245,236,215,0.4); margin-top:0.4rem;">${escHtml(item.label || '')}</div>
      </div>
    `).join('')}
  </div>`;
}

function renderTwoColumn(data, revealClass) {
  const reverse = data.reverse ? ' row-reverse' : '';
  return `<div class="${revealClass}" style="display:grid; grid-template-columns:1fr 1fr; gap:3rem; align-items:center; margin:2rem 0;${reverse ? ` direction:rtl;` : ''}>
    <div${reverse ? ' style="direction:ltr;"' : ''}>
      ${data.image_url ? `<img src="${escHtml(data.image_url)}" alt="${escHtml(data.image_alt || '')}" style="width:100%; border-radius:8px; border:1px solid var(--gold-border);">
      ${data.image_caption ? `<p style="font-size:0.75rem; color:rgba(245,236,215,0.4); font-style:italic; margin-top:0.4rem;">${escHtml(data.image_caption)}</p>` : ''}` : ''}
    </div>
    <div${reverse ? ' style="direction:ltr;"' : ''}>
      ${data.eyebrow ? `<span class="section-eyebrow">${escHtml(data.eyebrow)}</span>` : ''}
      ${data.title ? `<h2 style="font-family:var(--font-display); font-size:clamp(1.4rem,2.5vw,1.8rem); font-weight:600; color:var(--white); margin:0.5rem 0;">${escHtml(data.title)}</h2>` : ''}
      ${data.show_divider ? `<div class="gold-divider" style="margin:0.75rem 0;"><div class="gold-divider-line" style="max-width:60px;"></div><div class="gold-divider-ornament">◆</div><div class="gold-divider-line" style="max-width:60px;"></div></div>` : ''}
      ${data.content ? `<p style="font-size:0.9rem; color:rgba(245,236,215,0.55); line-height:1.8;">${escHtml(data.content)}</p>` : ''}
      ${data.facts ? data.facts.map(f =>
        `<div style="display:flex; align-items:flex-start; gap:0.6rem; margin-top:0.6rem;"><span style="color:var(--antique-gold); font-size:0.6rem;">◆</span><span style="font-size:0.85rem; color:rgba(245,236,215,0.55);">${escHtml(f)}</span></div>`
      ).join('') : ''}
      ${data.button_url ? `<a href="${escHtml(data.button_url)}" class="btn ${data.button_style === 'ghost' ? 'btn-ghost' : 'btn-primary'}" style="display:inline-flex; font-size:0.7rem; padding:0.7rem 1.5rem; margin-top:1rem; text-decoration:none;">${escHtml(data.button_text || 'Learn More')}</a>` : ''}
    </div>
  </div>`;
}

function renderDivider(data, revealClass) {
  const style = data.style || 'solid';
  return `<div class="${revealClass}" style="margin:2rem 0;">
    <hr style="border:none; border-top:1px ${style} var(--gold-border);">
  </div>`;
}

function renderSpacer(data) {
  const height = parseInt(data.height) || 40;
  return `<div style="height:${height}px;"></div>`;
}

function renderHtml(data, revealClass) {
  if (!data.code) return '';
  return `<div class="${revealClass}">${data.code}</div>`;
}

export const PAGE_TEMPLATES = {
  home: {
    title: 'Home',
    slug: 'home',
    content: JSON.parse(`[{"id":"home-header-1","type":"page-header","data":{"eyebrow":"Uji, Kyoto, Japan","title":"The <em>Art</em> of Matcha","subtitle":"Stone-ground in small batches. Third-party tested. Direct from family farms in Uji, Kyoto since 1920.","background_url":"Powder.jpg","ornament":"◆ ◆ ◆"}},{"id":"home-intro-1","type":"content-block","data":{"heading":"Our Collection","content":"Four teas, one origin.\\nEach tea is hand-selected from Uji or Kagoshima, processed in small batches, and delivered fresh to your door.","list_items":[],"list_bullet":"◆"}}]`)
  },
  learn: {
    title: 'Learn',
    slug: 'learn',
    content: JSON.parse(`[{"id":"learn-header-1","type":"page-header","data":{"eyebrow":"Education","title":"The Way of <em>Matcha</em>","subtitle":"From shading to stone-grinding, understand what makes ceremonial matcha exceptional.","background_url":"Powder.jpg","ornament":"◆"}}]`)
  },
  quality: {
    title: 'Quality',
    slug: 'quality',
    content: JSON.parse(`[{"id":"quality-header-1","type":"page-header","data":{"eyebrow":"Quality Assurance","title":"Radical <em>Transparency</em>","subtitle":"We test every batch. We trace every leaf. We stand behind every tin.","background_url":"Powder.jpg","ornament":"◆"}}]`)
  },
  contact: {
    title: 'Contact',
    slug: 'contact',
    content: JSON.parse(`[{"id":"contact-header-1","type":"page-header","data":{"eyebrow":"Get in Touch","title":"We'd Love to Hear <em>From You</em>","subtitle":"Whether you have a question about our teas, your order, or just want to say hello.","background_url":"Powder.jpg","ornament":"◆"}}]`)
  }
};

export async function seedPage(slug) {
  const template = PAGE_TEMPLATES[slug];
  if (!template) throw new Error(`No template for slug: ${slug}`);

  const { data: existing } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('pages')
      .update({
        title: template.title,
        content: template.content,
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    if (error) throw error;
    return { action: 'updated', id: existing.id };
  } else {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        title: template.title,
        slug: template.slug,
        content: template.content,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    if (error) throw error;
    return { action: 'created', id: data.id };
  }
}
