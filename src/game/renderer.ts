import type { PlotState } from '../types';
import { cropById } from '../config/crops';

export class FarmRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private dpr = Math.min(window.devicePixelRatio || 1, 2);
  private logicalW = 1280;
  private logicalH = 720;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Không tạo được Canvas 2D');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    this.canvas.width = Math.max(1, Math.floor(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * this.dpr));
    this.ctx.setTransform(this.canvas.width / this.logicalW, 0, 0, this.canvas.height / this.logicalH, 0, 0);
  }

  screenToWorld(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (clientX - r.left) / r.width * this.logicalW, y: (clientY - r.top) / r.height * this.logicalH };
  }

  plotAt(x: number, y: number, plots: PlotState[]) {
    for (const p of plots) {
      const pos = this.plotPosition(p.row, p.col);
      if (Math.abs(x - pos.x) < 54 && Math.abs(y - pos.y) < 34) return p;
    }
    return undefined;
  }

  draw(plots: PlotState[], selected?: string, visitorName?: string) {
    const c = this.ctx;
    c.clearRect(0, 0, this.logicalW, this.logicalH);
    const g = c.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#bfe6fb');
    g.addColorStop(.48, '#d7efc3');
    g.addColorStop(1, '#7dbb61');
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
    this.drawScenery();
    this.drawPaths();
    plots.forEach(p => this.drawPlot(p, p.id === selected));
    this.drawPond();
    this.drawBarn();
    this.drawHouse();
    if (visitorName) {
      c.fillStyle = 'rgba(34,63,36,.84)';
      c.beginPath();
      c.roundRect(420, 20, 440, 42, 16);
      c.fill();
      c.fillStyle = '#fff';
      c.font = '700 21px system-ui';
      c.textAlign = 'center';
      c.fillText(`Đang ghé nông trại của ${visitorName}`, 640, 48);
    }
  }

  private plotPosition(row: number, col: number) {
    return { x: 640 + (col - row) * 86, y: 230 + (col + row) * 42 };
  }

  private isoDiamond(x: number, y: number, w: number, h: number, fill: string, stroke = '#7a5732') {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x, y - h / 2);
    c.lineTo(x + w / 2, y);
    c.lineTo(x, y + h / 2);
    c.lineTo(x - w / 2, y);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }

  private drawPlot(p: PlotState, selected: boolean) {
    const pos = this.plotPosition(p.row, p.col);
    const c = this.ctx;
    c.save();
    c.shadowColor = 'rgba(60,42,15,.22)';
    c.shadowBlur = 6;
    c.shadowOffsetY = 3;
    this.isoDiamond(pos.x, pos.y, 136, 68, selected ? '#ab7a48' : '#94653f', selected ? '#ffe278' : '#6b4a31');
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.16)';
    c.beginPath();
    c.moveTo(pos.x - 47, pos.y);
    c.lineTo(pos.x + 47, pos.y);
    c.stroke();
    if (!p.cropId) return;

    const crop = cropById[p.cropId];
    if (!crop) return;
    const now = Date.now();
    const planted = p.plantedAt ? Date.parse(p.plantedAt) : now;
    const harvest = p.harvestAt ? Date.parse(p.harvestAt) : planted + crop.growMinutes * 60000;
    const progress = Math.max(0, Math.min(1, (now - planted) / Math.max(1, harvest - planted)));
    const watered = p.wateredAt ? Date.parse(p.wateredAt) : planted;
    const dryHours = (now - watered) / 3600000;
    const dead = Boolean(p.deadAt);

    this.drawCrop(pos.x, pos.y - 15, crop.colors, progress, dead, dryHours > crop.waterToleranceHours);
    if (progress >= 1 && !dead) {
      c.fillStyle = '#ffe66d';
      c.beginPath();
      c.arc(pos.x + 30, pos.y - 42, 9, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#604800';
      c.font = 'bold 11px system-ui';
      c.textAlign = 'center';
      c.fillText('!', pos.x + 30, pos.y - 38);
    }
    if (dryHours > crop.waterToleranceHours * .72 && !dead) {
      c.fillStyle = '#4aa7d6';
      c.beginPath();
      c.moveTo(pos.x - 34, pos.y - 48);
      c.quadraticCurveTo(pos.x - 43, pos.y - 35, pos.x - 34, pos.y - 29);
      c.quadraticCurveTo(pos.x - 25, pos.y - 35, pos.x - 34, pos.y - 48);
      c.fill();
    }
    if (dead) {
      c.fillStyle = '#654632';
      c.font = '600 11px system-ui';
      c.textAlign = 'center';
      c.fillText('Đã chết', pos.x, pos.y + 43);
    }
  }

  private drawCrop(x: number, y: number, colors: string[], progress: number, dead: boolean, dry: boolean) {
    const c = this.ctx;
    const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
    const stemH = 13 + p * 25;
    const leafW = 7 + p * 10;
    const leafH = 4 + p * 5;
    const fruitR = 4 + p * 4;
    const leafColor = dead ? '#7f6b4f' : dry ? '#b6a65b' : colors[0];
    const fruitColor = dead ? '#695d50' : colors[1];

    c.save();
    c.lineCap = 'round';
    c.strokeStyle = dead ? '#6c5a47' : dry ? '#9b8050' : '#3b7938';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(x, y + 15);
    c.lineTo(x, y + 15 - stemH);
    c.stroke();

    c.fillStyle = leafColor;
    c.beginPath();
    c.ellipse(x - 10, y + 4 - stemH * .48, leafW, leafH, -.42, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(x + 10, y + 3 - stemH * .52, leafW, leafH, .42, 0, Math.PI * 2);
    c.fill();

    if (p > .55) {
      c.fillStyle = fruitColor;
      const count = p > .85 ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const angle = i * Math.PI * 2 / count - Math.PI / 2;
        const fx = x + Math.cos(angle) * 10;
        const fy = y - stemH + 8 + Math.sin(angle) * 5;
        c.beginPath();
        c.arc(fx, fy, fruitR, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }

  private drawScenery() {
    const c = this.ctx;
    c.fillStyle = '#5aa45a';
    c.beginPath();
    c.ellipse(95, 92, 135, 62, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6db865';
    c.beginPath();
    c.ellipse(1180, 105, 145, 66, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#7dc26b';
    c.beginPath();
    c.ellipse(560, 690, 510, 105, 0, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 6; i++) {
      const x = 72 + i * 205;
      const y = 620 + (i % 2) * 12;
      c.fillStyle = '#3e7e42';
      c.fillRect(x - 5, y - 35, 10, 35);
      c.beginPath();
      c.arc(x, y - 45, 20, 0, Math.PI * 2);
      c.fillStyle = '#4d9749';
      c.fill();
    }
  }

  private drawPaths() {
    const c = this.ctx;
    c.fillStyle = 'rgba(221,196,133,.72)';
    c.beginPath();
    c.moveTo(170, 395);
    c.quadraticCurveTo(340, 355, 470, 390);
    c.quadraticCurveTo(650, 440, 815, 430);
    c.quadraticCurveTo(1000, 420, 1130, 350);
    c.lineTo(1150, 390);
    c.quadraticCurveTo(1000, 470, 815, 475);
    c.quadraticCurveTo(620, 485, 445, 430);
    c.quadraticCurveTo(310, 390, 175, 425);
    c.closePath();
    c.fill();
  }

  private drawHouse() {
    const c = this.ctx;
    c.fillStyle = '#f4d39a';
    c.fillRect(1010, 205, 145, 104);
    c.fillStyle = '#bd5d45';
    c.beginPath();
    c.moveTo(990, 210);
    c.lineTo(1082, 140);
    c.lineTo(1175, 210);
    c.closePath();
    c.fill();
    c.fillStyle = '#75513b';
    c.fillRect(1070, 252, 40, 57);
    c.fillStyle = '#a9d5e6';
    c.fillRect(1030, 238, 28, 28);
    c.fillRect(1115, 238, 28, 28);
  }

  private drawBarn() {
    const c = this.ctx;
    c.fillStyle = '#b95443';
    c.fillRect(1035, 478, 120, 88);
    c.fillStyle = '#7f3e34';
    c.beginPath();
    c.moveTo(1018, 483);
    c.lineTo(1095, 430);
    c.lineTo(1172, 483);
    c.closePath();
    c.fill();
    c.fillStyle = '#f0d6a1';
    c.fillRect(1078, 510, 38, 56);
  }

  private drawPond() {
    const c = this.ctx;
    c.fillStyle = '#7bc1db';
    c.beginPath();
    c.ellipse(180, 520, 68, 42, -.2, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#ffffff66';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(162, 512, 17, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(210, 528, 10, 0, Math.PI * 2);
    c.stroke();
  }
}
