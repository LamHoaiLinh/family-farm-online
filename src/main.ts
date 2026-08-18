import './styles.css';
import { FarmRenderer } from './game/renderer';
import { GameApi, CROPS } from './services/gameApi';
import { demoMode, supabase } from './services/supabase';
import type { CropId, PlotState } from './types';

const api=new GameApi();
let state:any; let selectedCrop:CropId='carrot'; let selectedPlot:string|undefined; let visitor:{id:string,name:string}|undefined;
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<div id="authScreen" class="auth-screen hidden"><form id="authForm" class="auth-card"><h1>🌱 Nông Trại Gia Đình</h1><p id="authSubtitle">Đăng nhập để tiếp tục nông trại của bạn.</p><label>Tên người chơi<input id="authUser" autocomplete="username" required minlength="3" maxlength="24"></label><label id="displayWrap" class="hidden">Tên hiển thị<input id="authDisplay" maxlength="30"></label><label>Mật khẩu<input id="authPass" type="password" autocomplete="current-password" required minlength="6"></label><label id="familyWrap" class="hidden">Mã gia đình<input id="familyCode" maxlength="40"></label><button id="authSubmit" type="submit">Đăng nhập</button><button id="toggleAuth" type="button" class="link-btn">Chưa có tài khoản? Đăng ký</button><small id="authError"></small></form></div>
<div id="rotate"><div class="rotate-card"><div class="phone-icon">▭↻</div><strong>Hãy xoay ngang điện thoại</strong><span>Nông Trại Gia Đình được thiết kế cho màn hình ngang.</span></div></div>
<div id="shell">
<header class="hud"><div class="brand">🌱 Nông Trại Gia Đình</div><div id="stats"></div><button id="helpBtn" class="round">?</button></header>
<main class="game"><canvas id="farm"></canvas><div id="toast"></div></main>
<nav class="bottom-nav">
<button data-panel="crops" class="active">🌱<span>Gieo trồng</span></button><button data-panel="warehouse">📦<span>Kho</span></button><button data-panel="orders">📋<span>Đơn hàng</span></button><button data-panel="neighbors">👨‍🌾<span>Hàng xóm</span></button><button data-panel="villa">🏡<span>Nhà Vườn</span></button>
</nav>
<section id="panel" class="panel"></section>
</div>`;
const canvas=document.querySelector<HTMLCanvasElement>('#farm')!; const renderer=new FarmRenderer(canvas);

function toast(msg:string,type='info'){const el=document.querySelector<HTMLDivElement>('#toast')!;el.textContent=msg;el.className=`show ${type}`;clearTimeout((toast as any).t);(toast as any).t=setTimeout(()=>el.className='',3600)}
function updateOrientation(){document.body.classList.toggle('portrait',innerHeight>innerWidth && innerWidth<900)} window.addEventListener('resize',updateOrientation);updateOrientation();
async function tryLandscape(){try{await (screen.orientation as any)?.lock?.('landscape')}catch{}}
document.addEventListener('pointerdown',()=>tryLandscape(),{once:true});

let authRegister=false;
function authEmail(username:string){return `${username.trim().toLowerCase()}@family-farm.local`;}
async function ensureAuth(){
 if(demoMode) return true;
 const {data}=await supabase!.auth.getSession(); if(data.session) return true;
 const screen=document.querySelector<HTMLDivElement>('#authScreen')!;screen.classList.remove('hidden');document.querySelector('#shell')!.classList.add('hidden');
 return false;
}
function setupAuth(){
 const form=document.querySelector<HTMLFormElement>('#authForm')!, toggle=document.querySelector<HTMLButtonElement>('#toggleAuth')!;
 const refresh=()=>{document.querySelector('#familyWrap')!.classList.toggle('hidden',!authRegister);document.querySelector('#displayWrap')!.classList.toggle('hidden',!authRegister);document.querySelector('#authSubtitle')!.textContent=authRegister?'Tạo tài khoản bằng Mã gia đình. Không cần email hay OTP.':'Đăng nhập để tiếp tục nông trại của bạn.';(document.querySelector('#authSubmit') as HTMLButtonElement).textContent=authRegister?'Đăng ký':'Đăng nhập';toggle.textContent=authRegister?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký'};
 toggle.onclick=()=>{authRegister=!authRegister;refresh()}; refresh();
 form.onsubmit=async e=>{e.preventDefault();const username=(document.querySelector<HTMLInputElement>('#authUser')!).value.trim();const password=document.querySelector<HTMLInputElement>('#authPass')!.value;const error=document.querySelector<HTMLElement>('#authError')!;error.textContent='';try{let email=authEmail(username);if(authRegister){const familyCode=document.querySelector<HTMLInputElement>('#familyCode')!.value.trim();const displayName=document.querySelector<HTMLInputElement>('#authDisplay')!.value.trim()||username;const {data, error:fnError}=await supabase!.functions.invoke('register-player',{body:{username,password,familyCode,displayName}});if(fnError)throw fnError;if(!data?.ok)throw Error(data?.error||'Không đăng ký được');email=data.loginKey||email;}const {error:loginError}=await supabase!.auth.signInWithPassword({email,password});if(loginError)throw loginError;document.querySelector('#authScreen')!.classList.add('hidden');document.querySelector('#shell')!.classList.remove('hidden');await load();}catch(err:any){error.textContent=err.message||'Không đăng nhập được.'}};
}
async function load(){state=await api.getState();render();showPanel('crops');}
function render(){document.querySelector('#stats')!.innerHTML=`<span>💰 ${state.player.gold.toLocaleString('vi-VN')}</span><span>💎 ${state.player.diamonds}</span><span>⭐ Cấp ${state.player.level}</span><span>📦 ${state.player.inventoryUsed}/${state.player.warehouseCapacity}</span>${demoMode?'<em>DEMO</em>':''}`;renderer.draw(state.plots,selectedPlot,visitor?.name)}
setInterval(()=>renderer.draw(state?.plots||[],selectedPlot,visitor?.name),1000);

canvas.addEventListener('pointerup',async e=>{if(!state)return;const w=renderer.screenToWorld(e.clientX,e.clientY);const p=renderer.plotAt(w.x,w.y,state.plots);if(!p)return;selectedPlot=p.id;renderer.draw(state.plots,selectedPlot,visitor?.name);try{if(visitor){if(p.cropId){const r=await api.steal(visitor.id,p.id);toast(r.message||'Đã hái trộm thành công!','success')}else toast('Ô này không có nông sản để lấy.')} else if(!p.cropId){await api.plant(p.id,selectedCrop);toast(`Đã gieo ${CROPS.find(c=>c.id===selectedCrop)?.name}.`,'success')} else if(Date.now()>=Date.parse(p.harvestAt||'2999-01-01')){await api.harvest(p.id);toast('Thu hoạch thành công, nông sản đã vào Kho.','success')} else {await api.water(p.id);toast('Đã tưới cây. 💧','success')}state=await api.getState();render();}catch(err:any){toast(err.message||'Không thực hiện được.','error')}});

document.querySelectorAll<HTMLButtonElement>('.bottom-nav button').forEach(b=>b.onclick=()=>showPanel(b.dataset.panel!));
document.querySelector('#helpBtn')!.addEventListener('click',()=>showHelp());

function showPanel(name:string){document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',(b as HTMLElement).dataset.panel===name));const p=document.querySelector<HTMLDivElement>('#panel')!;p.classList.add('open');
 if(name==='crops'){p.innerHTML=`<div class="panel-head"><b>Chọn cây để gieo</b><button class="close">×</button></div><div class="crop-grid">${CROPS.map(c=>`<button class="crop ${selectedCrop===c.id?'sel':''} ${state.player.level<c.level?'locked':''}" data-crop="${c.id}" ${state.player.level<c.level?'disabled':''}><i>${c.emoji}</i><b>${c.name}</b><small>${c.seedCost} Vàng · ${formatTime(c.growMinutes)}</small><small>Mở Cấp ${c.level}</small></button>`).join('')}</div>`;p.querySelectorAll<HTMLButtonElement>('[data-crop]').forEach(b=>b.onclick=()=>{selectedCrop=b.dataset.crop as CropId;showPanel('crops')});}
 if(name==='warehouse'){const items=Object.entries(state.inventory).filter(([,q]:any)=>q>0);p.innerHTML=`<div class="panel-head"><b>Kho nông sản · ${state.player.inventoryUsed}/${state.player.warehouseCapacity}</b><button class="close">×</button></div><div class="warehouse-actions"><button id="expand">💎 Mở thêm 5 chỗ – 1 Kim Cương</button></div><div class="item-list">${items.length?items.map(([id,q]:any)=>{const c=CROPS.find(x=>x.id===id);return `<div><span>${c?.emoji} ${c?.name}</span><b>${q}</b><button data-sell="${id}">Bán 1</button></div>`}).join(''):'<p>Kho đang trống.</p>'}</div>`;p.querySelector('#expand')?.addEventListener('click',async()=>{try{await api.expandWarehouse();state=await api.getState();render();showPanel('warehouse');toast('Kho đã tăng thêm 5 chỗ.','success')}catch(e:any){toast(e.message,'error')}});p.querySelectorAll<HTMLButtonElement>('[data-sell]').forEach(b=>b.onclick=async()=>{try{await api.sell(b.dataset.sell as CropId,1);state=await api.getState();render();showPanel('warehouse')}catch(e:any){toast(e.message,'error')}})}
 if(name==='orders'){p.innerHTML=`<div class="panel-head"><b>Đơn hàng</b><button class="close">×</button></div><div class="orders"><article><h3>🍲 Bếp nhà ngoại</h3><p>6 Cà rốt · 4 Bắp</p><strong>+120 Vàng · +18 EXP</strong><div><button>Giao đơn</button><button class="ghost">Bỏ đơn</button></div></article><article><h3>🥤 Quầy nước trái cây</h3><p>3 Dâu tây · 2 Dưa hấu</p><strong>+260 Vàng · +1 Gỗ</strong><div><button>Giao đơn</button><button class="ghost">Bỏ đơn</button></div></article><article class="cool"><h3>Đang tìm đơn mới…</h3><p>Đơn mới sau 12:48</p></article></div>`;}
 if(name==='neighbors'){p.innerHTML=`<div class="panel-head"><b>Hàng xóm trong gia đình</b><button class="close">×</button></div><div id="neighborList" class="neighbor-list"><p>Đang tải…</p></div>`;api.listNeighbors().then((xs:any[])=>{const l=p.querySelector('#neighborList')!;l.innerHTML=xs.map(x=>`<button data-visit="${x.id}" data-name="${x.name}"><span class="avatar">👩‍🌾</span><span><b>${x.name}</b><small>Cấp ${x.level} · ${x.online?'🟢 Đang online':'⚪ Offline'}</small></span><strong>Ghé thăm →</strong></button>`).join('');l.querySelectorAll<HTMLButtonElement>('[data-visit]').forEach(b=>b.onclick=async()=>{visitor={id:b.dataset.visit!,name:b.dataset.name!};state=await api.visitNeighbor(visitor.id);p.classList.remove('open');render();toast(`Đã đến nông trại của ${visitor.name}. Cây chín có thể hái trộm một ít.`,'success')})});}
 if(name==='villa'){p.innerHTML=`<div class="panel-head"><b>Nhà Vườn dài hạn</b><button class="close">×</button></div><div class="villa"><div class="progress"><i style="width:18%"></i></div><p>Tiến độ hiện tại: <b>18%</b></p><div class="milestones"><span>✅ Móng nhà</span><span>✅ Khung nhà</span><span>🧱 Tường · thiếu 45 Gạch</span><span>🔒 Mái nhà · cần Cấp 12</span><span>🔒 Hồ cá · cần 4 💎</span><span>🔒 Chuồng chó · chống hái trộm</span></div><p class="hint">Kim Cương không mua bằng tiền thật. Hãy tích lũy nông sản, vật liệu và thành tựu để đổi.</p></div>`;}
 p.querySelector('.close')?.addEventListener('click',()=>p.classList.remove('open'));
}
function showHelp(){const p=document.querySelector<HTMLDivElement>('#panel')!;p.classList.add('open');p.innerHTML=`<div class="panel-head"><b>Hướng dẫn nhanh</b><button class="close">×</button></div><div class="help"><h3>🌱 Trồng cây</h3><p>Chọn cây rồi chạm ô đất trống. Khi cây đang lớn, chạm vào cây để tưới. Khi có dấu ! màu vàng, chạm để thu hoạch.</p><h3>📦 Kho đầy</h3><p>Nếu kho đầy, cây chín sẽ ở nguyên trên ruộng. Hãy bán, giao đơn hoặc dùng <b>1 Kim Cương để mở thêm 5 chỗ</b>.</p><h3>💧 Cây thiếu nước/chết</h3><p>Game không ép vào thường xuyên. Khi cây bắt đầu khô sẽ hiện biểu tượng nước. Nếu để quá lâu, game lưu nguyên nhân và giải thích vì sao cây chết.</p><h3>💎 Kim Cương</h3><p>Không thể mua bằng Vàng hoặc tiền thật. Kim Cương dùng để mở Kho, nâng tốc độ cây và xây Nhà Vườn.</p><h3>👨‍🌾 Hàng xóm</h3><p>Chỉ thành viên cùng gia đình. Có thể tưới giúp hoặc hái trộm một phần nhỏ nông sản đã chín. Không thể lấy Vàng, Kim Cương hay phá cây.</p><button id="backFarm">Về nông trại của tôi</button></div>`;p.querySelector('.close')!.addEventListener('click',()=>p.classList.remove('open'));p.querySelector('#backFarm')!.addEventListener('click',async()=>{visitor=undefined;state=await api.getState();render();p.classList.remove('open')})}
function formatTime(m:number){if(m<60)return `${m} phút`;const h=m/60;return Number.isInteger(h)?`${h} giờ`:`${h.toFixed(1)} giờ`}

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
setupAuth();
ensureAuth().then(ok=>{if(ok) load().catch(e=>{toast(e.message,'error');if(!demoMode && supabase){document.querySelector('#panel')!.innerHTML='<p>Hãy cấu hình Supabase theo README.md.</p>'}})});
