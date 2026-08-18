import { CROPS } from './config/crops';

function prepareCanvas(el: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Number(el.getAttribute('width')) || 28;
  const cssH = Number(el.getAttribute('height')) || 28;
  el.width = Math.round(cssW * dpr);
  el.height = Math.round(cssH * dpr);
  el.style.width = `${cssW}px`;
  el.style.height = `${cssH}px`;
  const ctx = el.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return { ctx, w: cssW, h: cssH };
}

function paintIcon(el: HTMLCanvasElement, icon: string) {
  const { ctx: c, w, h } = prepareCanvas(el);
  const s = Math.min(w, h);
  c.save();
  c.translate(w / 2, h / 2);
  c.scale(s / 32, s / 32);
  c.translate(-16, -16);
  c.lineWidth = 2;
  if (icon === 'sprout' || icon === 'seed') {
    c.strokeStyle = '#386d32'; c.beginPath(); c.moveTo(16, 27); c.lineTo(16, 12); c.stroke();
    c.fillStyle = '#77b64e'; c.beginPath(); c.ellipse(10, 11, 7, 4, .5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5c9f44'; c.beginPath(); c.ellipse(22, 9, 7, 4, -.5, 0, Math.PI * 2); c.fill();
    if (icon === 'seed') { c.fillStyle = '#9c6a3d'; c.beginPath(); c.ellipse(16, 27, 5, 3, 0, 0, Math.PI * 2); c.fill(); }
  } else if (icon === 'coin') {
    c.fillStyle = '#f4c84a'; c.strokeStyle = '#b68120'; c.beginPath(); c.arc(16, 16, 10, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#fff0a1'; c.beginPath(); c.arc(13, 12, 3, 0, Math.PI * 2); c.fill();
  } else if (icon === 'diamond') {
    c.fillStyle = '#62c8eb'; c.strokeStyle = '#2589b8'; c.beginPath(); c.moveTo(16, 4); c.lineTo(27, 12); c.lineTo(16, 28); c.lineTo(5, 12); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(8, 12); c.lineTo(24, 12); c.moveTo(16, 5); c.lineTo(12, 12); c.lineTo(16, 27); c.lineTo(20, 12); c.closePath(); c.stroke();
  } else if (icon === 'star') {
    c.fillStyle = '#f3c94d'; c.strokeStyle = '#b98524'; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? 5 : 11; const x = 16 + Math.cos(a) * r, y = 16 + Math.sin(a) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); c.fill(); c.stroke();
  } else if (icon === 'box') {
    c.fillStyle = '#b98250'; c.strokeStyle = '#704625'; c.beginPath(); c.rect(6, 11, 20, 15); c.fill(); c.stroke();
    c.fillStyle = '#d7a66e'; c.beginPath(); c.moveTo(6, 11); c.lineTo(16, 5); c.lineTo(26, 11); c.lineTo(16, 16); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#815431'; c.beginPath(); c.moveTo(16, 16); c.lineTo(16, 26); c.stroke();
  } else if (icon === 'clipboard') {
    c.fillStyle = '#f7efd0'; c.strokeStyle = '#6b6044'; c.beginPath(); c.roundRect(7, 6, 18, 22, 3); c.fill(); c.stroke();
    c.fillStyle = '#9c7742'; c.fillRect(12, 4, 8, 5);
    c.strokeStyle = '#75816c'; c.lineWidth = 1.5; [13,18,23].forEach(y => { c.beginPath(); c.moveTo(11, y); c.lineTo(21, y); c.stroke(); });
  } else if (icon === 'neighbor') {
    c.fillStyle = '#6da357'; c.beginPath(); c.arc(16, 10, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e6c19c'; c.beginPath(); c.arc(16, 13, 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4a7440'; c.beginPath(); c.ellipse(16, 25, 10, 7, 0, Math.PI, Math.PI * 2); c.fill();
    c.fillStyle = '#d4a044'; c.fillRect(8, 7, 16, 3);
  } else if (icon === 'house') {
    c.fillStyle = '#f3d194'; c.strokeStyle = '#81583b'; c.fillRect(7, 14, 18, 13); c.strokeRect(7, 14, 18, 13);
    c.fillStyle = '#b85845'; c.beginPath(); c.moveTo(4, 15); c.lineTo(16, 5); c.lineTo(28, 15); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#76513a'; c.fillRect(14, 20, 5, 7);
  } else if (icon === 'help') {
    c.fillStyle = '#fff'; c.font = '900 24px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 16, 16);
  } else if (icon === 'rotate') {
    c.strokeStyle = '#315e39'; c.lineWidth = 2.4; c.beginPath(); c.roundRect(10, 6, 12, 21, 3); c.stroke();
    c.beginPath(); c.arc(19, 17, 10, -.8, 1.5); c.stroke(); c.fillStyle = '#315e39'; c.beginPath(); c.moveTo(26, 24); c.lineTo(27, 17); c.lineTo(21, 21); c.closePath(); c.fill();
  } else if (icon === 'food') {
    c.fillStyle = '#e7a15a'; c.beginPath(); c.arc(16, 17, 9, 0, Math.PI); c.fill();
    c.strokeStyle = '#70462f'; c.beginPath(); c.moveTo(7, 17); c.lineTo(25, 17); c.stroke();
    c.strokeStyle = '#8b9d75'; c.beginPath(); c.moveTo(11, 8); c.quadraticCurveTo(12, 4, 14, 8); c.moveTo(18, 8); c.quadraticCurveTo(19, 4, 21, 8); c.stroke();
  }
  c.restore();
}

function paintCropIcon(el: HTMLCanvasElement, cropId: string) {
  const crop = CROPS.find(c => c.id === cropId);
  if (!crop) return;
  const { ctx: c, w, h } = prepareCanvas(el);
  const cx = w / 2;
  c.strokeStyle = '#39743a'; c.lineWidth = Math.max(2, w * .08); c.beginPath(); c.moveTo(cx, h * .78); c.lineTo(cx, h * .34); c.stroke();
  c.fillStyle = crop.colors[0];
  c.beginPath(); c.ellipse(cx - w * .16, h * .43, w * .2, h * .11, .45, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(cx + w * .16, h * .38, w * .2, h * .11, -.45, 0, Math.PI * 2); c.fill();
  c.fillStyle = crop.colors[1];
  c.beginPath(); c.arc(cx, h * .27, Math.max(3, w * .15), 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(cx - w * .13, h * .32, Math.max(2, w * .1), 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(cx + w * .13, h * .32, Math.max(2, w * .1), 0, Math.PI * 2); c.fill();
}

export function paintIcons(root: ParentNode = document) {
  root.querySelectorAll<HTMLCanvasElement>('canvas[data-icon]').forEach(el => paintIcon(el, el.dataset.icon || 'sprout'));
  root.querySelectorAll<HTMLCanvasElement>('canvas[data-crop-icon]').forEach(el => paintCropIcon(el, el.dataset.cropIcon || 'carrot'));
}
