import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{
  const {username,password,familyCode,displayName}=await req.json();
  if(!/^[a-zA-Z0-9_.-]{3,24}$/.test(username||''))throw Error('Tên người chơi phải dài 3–24 ký tự, không có khoảng trắng.');
  if((password||'').length<6)throw Error('Mật khẩu cần ít nhất 6 ký tự.');
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const enc=new TextEncoder();
  const digest=await crypto.subtle.digest('SHA-256',enc.encode(String(familyCode).trim().toLowerCase()));
  const hex=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const {data:family,error:fErr}=await admin.from('families').select('id').eq('join_code_hash',hex).maybeSingle();
  if(fErr)throw fErr;
  if(!family)throw Error('Mã gia đình không đúng.');
  const synthetic=`${username.toLowerCase()}@family-farm.local`;
  const {data:u,error:uErr}=await admin.auth.admin.createUser({email:synthetic,password,email_confirm:true,user_metadata:{username}});if(uErr)throw uErr;
  const userId=u.user.id;
  await admin.from('profiles').insert({id:userId,family_id:family.id,username:username.toLowerCase(),display_name:displayName||username});
  const plots=[];for(let r=0;r<4;r++)for(let c=0;c<6;c++)plots.push({owner_id:userId,row:r,col:c});await admin.from('farm_plots').insert(plots);
  return new Response(JSON.stringify({ok:true,loginKey:synthetic}),{headers:{...cors,'Content-Type':'application/json'}});
 }catch(e){return new Response(JSON.stringify({ok:false,error:e.message}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
});
