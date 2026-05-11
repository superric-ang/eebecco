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
    case 'heading': return renderHeading(el.data, revealClass);
    case 'text': return renderText(el.data, revealClass);
    case 'image': return renderImage(el.data, revealClass);
    case 'video': return renderVideo(el.data, revealClass);
    case 'button': return renderButton(el.data, revealClass);
    case 'columns': return renderColumns(el.data, revealClass);
    case 'divider': return renderDivider(el.data, revealClass);
    case 'spacer': return renderSpacer(el.data, revealClass);
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
