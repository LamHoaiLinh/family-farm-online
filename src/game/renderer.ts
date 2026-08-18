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
    this.canvas.width = Math.floor(rect.width * this.dpr);
    this.canvas.height = Math.floor(rect.height * this.dpr);
    this.ctx.setTransform(this.canvas.width / this.logicalW, 0, 0, this.canvas.height / this.logicalH, 0, 0);
  }

  screenToWorld(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (clientX-r.left)/r.width*this.logicalW, y: (clientY-r.top)/r.height*this.logicalH };
  }

  plotAt(x:number,y:number, plots:PlotState[]) {
    for (const p of plots) {
      const pos=this.plotPosition(p.row,p.col);
      if (Math.abs(x-pos.x)<58 && Math.abs(y-pos.y)<38) return p;
    }
    return undefined;
  }

  draw(plots: PlotState[], selected?: string, visitorName?:string) {
    const c=this.ctx;
    c.clearRect(0,0,this.logicalW,this.logicalH);
    const g=c.createLinearGradient(0,0,0,720); g.addColorStop(0,'#bfe9ff'); g.addColorStop(.48,'#d9efb1'); g.addColorStop(1,'#72b55d');
    c.fillStyle=g;c.fillRect(0,0,1280,720);
    this.drawScenery();
    plots.forEach(p => this.drawPlot(p, p.id===selected));
    this.drawBarn(); this.drawHouse();
    if(visitorName){c.fillStyle='rgba(34,63,36,.85)';c.fillRect(455,72,370,48);c.fillStyle='#fff';c.font='700 22px system-ui';c.textAlign='center';c.fillText(`Đang ghé nông trại của ${visitorName}`,640,103);}
  }

  private isoDiamond(x:number,y:number,w:number,h:number,fill:string,stroke='#7a5732') { const c=this.ctx;c.beginPath();c.moveTo(x,y-h/2);c.lineTo(x+w/2,y);c.lineTo(x,y+h/2);c.lineTo(x-w/2,y);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=2;c.stroke(); }
  private plotPosition(row:number,col:number){ return {x:380+(col-row)*95, y:245+(col+row)*46}; }

  private drawPlot(p:PlotState, selected:boolean){
    const pos=this.plotPosition(p.row,p.col); const c=this.ctx;
    this.isoDiamond(pos.x,pos.y,150,78,selected?'#a87645':'#8d613d', selected?'#ffe278':'#6c4c33');
    c.strokeStyle='rgba(255,255,255,.16)';c.beginPath();c.moveTo(pos.x-55,pos.y);c.lineTo(pos.x+55,pos.y);c.stroke();
    if(!p.cropId) return;
    const crop=cropById[p.cropId]; if(!crop)return;
    const now=Date.now(); const planted=p.plantedAt?Date.parse(p.plantedAt):now; const harvest=p.harvestAt?Date.parse(p.harvestAt):planted+crop.growMinutes*60000;
    const progress=Math.max(0,Math.min(1,(now-planted)/(harvest-planted)));
    const watered=p.wateredAt?Date.parse(p.wateredAt):planted; const dryHours=(now-watered)/3600000;
    const dead=Boolean(p.deadAt);
    this.drawCrop(pos.x,pos.y-26,crop.colors,progress,dead,dryHours>crop.waterToleranceHours);
    if(progress>=1&&!dead){c.fillStyle='#ffe66d';c.beginPath();c.arc(pos.x+42,pos.y-54,10,0,Math.PI*2);c.fill();c.fillStyle='#604800';c.font='bold 12px system-ui';c.textAlign='center';c.fillText('!',pos.x+42,pos.y-50);}
    if(dryHours>crop.waterToleranceHours*.72&&!dead){c.font='20px system-ui';c.fillText('💧',pos.x-44,pos.y-48);}
  }

  private drawCrop(x:number,y:number, colors:string[], progress:number, dead:boolean, dry:boolean){
    const c=this.ctx;c.save();c.translate(x,y); const scale=.45+.55*progress;c.scale(scale,scale);
    c.strokeStyle=dead?'#6c5a47':dry?'#9b8050':'#3b7938';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(0,28);c.lineTo(0,-22);c.stroke();
    const leaf=dead?'#7f6b4f':dry?'#b6a65b':colors[0];c.fillStyle=leaf;
    for(const s of [-1,1]){c.beginPath();c.ellipse(s*18,-2,22,10,s*.42,0,Math.PI*2);c.fill();}
    if(progress>.55){c.fillStyle=dead?'#695d50':colors[1];const n=progress>.85?3:1;for(let i=0;i<n;i++){const a=i*Math.PI*2/n-Math.PI/2;c.beginPath();c.arc(Math.cos(a)*17, -25+Math.sin(a)*8, 9+progress*4,0,Math.PI*2);c.fill();}}
    c.restore();
  }

  private drawScenery(){ const c=this.ctx; c.fillStyle='#4b9e55';c.beginPath();c.ellipse(150,110,190,85,0,0,Math.PI*2);c.fill();c.fillStyle='#5aaa5d';c.beginPath();c.ellipse(1120,150,220,100,0,0,Math.PI*2);c.fill(); for(let i=0;i<8;i++){const x=80+i*150,y=610+(i%2)*24;c.fillStyle='#3e7e42';c.fillRect(x-7,y-48,14,48);c.beginPath();c.arc(x,y-58,28,0,0+Math.PI*2);c.fillStyle='#4e9849';c.fill();}}
  private drawHouse(){const c=this.ctx;c.fillStyle='#f4d39a';c.fillRect(905,220,190,125);c.fillStyle='#bd5d45';c.beginPath();c.moveTo(880,225);c.lineTo(1000,135);c.lineTo(1120,225);c.closePath();c.fill();c.fillStyle='#75513b';c.fillRect(975,275,50,70);c.fillStyle='#a9d5e6';c.fillRect(930,255,35,35);c.fillRect(1035,255,35,35);}
  private drawBarn(){const c=this.ctx;c.fillStyle='#b95443';c.fillRect(985,455,160,115);c.fillStyle='#7f3e34';c.beginPath();c.moveTo(965,460);c.lineTo(1065,390);c.lineTo(1165,460);c.closePath();c.fill();c.fillStyle='#f0d6a1';c.fillRect(1040,495,50,75);}
}
