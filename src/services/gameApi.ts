import { supabase, demoMode } from './supabase';
import type { CropId, PlotState, PlayerState } from '../types';
import { CROPS, cropById } from '../config/crops';

const DEMO_KEY='family-farm-online-demo-v1';
interface DemoState { player:PlayerState; plots:PlotState[]; inventory:Record<string,number>; selectedCrop:CropId; }
function demoSeed():DemoState{
  const plots:PlotState[]=[]; for(let r=0;r<4;r++)for(let c=0;c<6;c++)plots.push({id:`${r}-${c}`,row:r,col:c});
  return {player:{id:'demo',name:'Linh',level:8,exp:520,gold:650,diamonds:2,warehouseCapacity:50,inventoryUsed:0},plots,inventory:{},selectedCrop:'carrot'};
}
function demoFresh():DemoState{
  const plots:PlotState[]=[]; for(let r=0;r<4;r++)for(let c=0;c<6;c++)plots.push({id:`${r}-${c}`,row:r,col:c});
  return {player:{id:'demo',name:'Linh',level:1,exp:0,gold:50,diamonds:0,warehouseCapacity:50,inventoryUsed:0},plots,inventory:{},selectedCrop:'carrot'};
}
function loadDemo(){try{return JSON.parse(localStorage.getItem(DEMO_KEY)||'') as DemoState}catch{return demoSeed()}}
function saveDemo(s:DemoState){localStorage.setItem(DEMO_KEY,JSON.stringify(s));}

export class GameApi {
  async getState(){
    if(demoMode) return loadDemo();
    const {data:{user}}=await supabase!.auth.getUser(); if(!user) throw new Error('Chưa đăng nhập');
    const [{data:profile,error:pErr},{data:plots,error:plErr},{data:inv,error:iErr}] = await Promise.all([
      supabase!.from('profiles').select('id,display_name,level,exp,gold,diamonds,warehouse_capacity').eq('id',user.id).single(),
      supabase!.from('farm_plots').select('*').eq('owner_id',user.id).order('row').order('col'),
      supabase!.from('inventory').select('item_id,quantity').eq('owner_id',user.id)
    ]);
    if(pErr||plErr||iErr) throw pErr||plErr||iErr;
    const inventory=Object.fromEntries((inv||[]).map((x:any)=>[x.item_id,x.quantity]));
    const used=Object.values(inventory).reduce((a:any,b:any)=>a+Number(b),0) as number;
    return {player:{id:profile.id,name:profile.display_name,level:profile.level,exp:profile.exp,gold:profile.gold,diamonds:profile.diamonds,warehouseCapacity:profile.warehouse_capacity,inventoryUsed:used},plots:(plots||[]).map(mapPlot),inventory,selectedCrop:'carrot' as CropId};
  }
  async plant(plotId:string,cropId:CropId){
    if(demoMode){const s=loadDemo(),p=s.plots.find(x=>x.id===plotId),crop=cropById[cropId];if(!p||p.cropId)throw Error('Ô đất đang được sử dụng.');if(s.player.gold<crop.seedCost)throw Error('Bạn chưa đủ Vàng để mua hạt giống.');s.player.gold-=crop.seedCost;const now=new Date();p.cropId=cropId;p.plantedAt=now.toISOString();p.wateredAt=now.toISOString();p.harvestAt=new Date(now.getTime()+crop.growMinutes*60000).toISOString();saveDemo(s);return;}
    const {error}=await supabase!.rpc('plant_crop',{p_plot_id:plotId,p_crop_id:cropId}); if(error)throw error;
  }
  async water(plotId:string){
    if(demoMode){const s=loadDemo(),p=s.plots.find(x=>x.id===plotId);if(!p?.cropId)throw Error('Ô này chưa có cây.');p.wateredAt=new Date().toISOString();saveDemo(s);return;}
    const {error}=await supabase!.rpc('water_crop',{p_plot_id:plotId});if(error)throw error;
  }
  async harvest(plotId:string){
    if(demoMode){const s=loadDemo(),p=s.plots.find(x=>x.id===plotId);if(!p?.cropId)throw Error('Ô này chưa có cây.');if(Date.now()<Date.parse(p.harvestAt!))throw Error('Cây chưa chín.');const crop=cropById[p.cropId];const current=s.inventory[p.cropId]||0;if(s.player.inventoryUsed+crop.baseYield>s.player.warehouseCapacity)throw Error(`Kho đã đầy ${s.player.inventoryUsed}/${s.player.warehouseCapacity}. Hãy bán hàng, giao đơn hoặc dùng 1 Kim Cương mở thêm 5 chỗ.`);s.inventory[p.cropId]=current+crop.baseYield;s.player.inventoryUsed+=crop.baseYield;s.player.exp+=crop.exp;Object.assign(p,{cropId:undefined,plantedAt:undefined,wateredAt:undefined,harvestAt:undefined,deadAt:undefined,deathReason:undefined});saveDemo(s);return;}
    const {error}=await supabase!.rpc('harvest_crop',{p_plot_id:plotId});if(error)throw error;
  }
  async expandWarehouse(){
    if(demoMode){const s=loadDemo();if(s.player.diamonds<1)throw Error('Bạn chưa đủ Kim Cương. Hãy đổi nông sản và vật liệu để nhận Kim Cương.');s.player.diamonds--;s.player.warehouseCapacity+=5;saveDemo(s);return;}
    const {error}=await supabase!.rpc('expand_warehouse');if(error)throw error;
  }
  async sell(cropId:CropId,qty:number){
    if(demoMode){const s=loadDemo(),have=s.inventory[cropId]||0;if(qty<=0||have<qty)throw Error('Không đủ nông sản.');s.inventory[cropId]=have-qty;s.player.inventoryUsed-=qty;s.player.gold+=cropById[cropId].sellPrice*qty;saveDemo(s);return;}
    const {error}=await supabase!.rpc('sell_item',{p_item_id:cropId,p_qty:qty});if(error)throw error;
  }
  async resetMyFarm(){
    if(demoMode){saveDemo(demoFresh());return {ok:true};}
    const {data,error}=await supabase!.rpc('reset_my_farm');
    if(error)throw error;
    return data;
  }
  async listNeighbors(){ if(demoMode)return [{id:'bich',name:'Bích',level:7,online:true},{id:'giakhang',name:'Gia Khang',level:6,online:false},{id:'sunny',name:'Sunny',level:4,online:true}]; const {data,error}=await supabase!.rpc('list_family_neighbors');if(error)throw error;return data; }
  async visitNeighbor(id:string){ if(demoMode){const s=demoSeed();s.player.name=id==='bich'?'Bích':id==='giakhang'?'Gia Khang':'Sunny'; ['tomato','corn','watermelon','carrot'].forEach((cid,i)=>{const p=s.plots[4+i*2];const crop=cropById[cid];p.cropId=cid as CropId;p.plantedAt=new Date(Date.now()-crop.growMinutes*70000).toISOString();p.wateredAt=new Date(Date.now()-12*3600000).toISOString();p.harvestAt=new Date(Date.now()-1000).toISOString();});return s;} const {data,error}=await supabase!.rpc('get_neighbor_farm',{p_neighbor_id:id});if(error)throw error;return {player:{id:data.player.id,name:data.player.name,level:data.player.level,exp:0,gold:0,diamonds:0,warehouseCapacity:0,inventoryUsed:0},plots:(data.plots||[]).map(mapPlot),inventory:{},selectedCrop:'carrot' as CropId}; }
  async steal(targetId:string,plotId:string){ if(demoMode)return {item_id:'carrot',quantity:1,message:'Bạn đã hái trộm 1 nông sản. Chủ vườn vẫn giữ phần lớn sản lượng.'}; const {data,error}=await supabase!.rpc('steal_crop',{p_target_owner:targetId,p_plot_id:plotId});if(error)throw error;return data; }
}

function mapPlot(p:any):PlotState{return {id:p.id,row:p.row,col:p.col,cropId:p.crop_id||undefined,plantedAt:p.planted_at||undefined,wateredAt:p.watered_at||undefined,harvestAt:p.harvest_at||undefined,deadAt:p.dead_at||undefined,deathReason:p.death_reason||undefined,stolenTotal:p.stolen_total||0};}
export { CROPS };
