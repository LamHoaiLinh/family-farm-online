import { createClient } from 'npm:@supabase/supabase-js@2.111.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

class AppError extends Error {}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function syntheticEmail(username: string) {
  return `${username}@family-farm.local`;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Phương thức không được hỗ trợ.' }, 405);

  let createdUserId: string | undefined;
  try {
    const payload = await req.json().catch(() => ({}));
    const username = String(payload.username ?? '').trim().toLowerCase();
    const password = String(payload.password ?? '');
    const familyCode = String(payload.familyCode ?? '').trim().toLowerCase();
    const displayName = String(payload.displayName ?? username).trim().slice(0, 30) || username;

    if (!/^[a-z0-9_.-]{3,24}$/.test(username)) {
      throw new AppError('Tên người chơi phải dài 3–24 ký tự và chỉ gồm chữ không dấu, số, _, . hoặc -.');
    }
    if (password.length < 8) throw new AppError('Mật khẩu cần ít nhất 8 ký tự.');
    if (familyCode.length < 8 || familyCode.length > 40) throw new AppError('Mã gia đình không hợp lệ.');

    const url = Deno.env.get('SUPABASE_URL');
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceRole) throw new Error('Missing Supabase server secrets');
    const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });

    const familyHash = await sha256Hex(familyCode);
    const { data: family, error: familyError } = await admin
      .from('families')
      .select('id')
      .eq('join_code_hash', familyHash)
      .maybeSingle();
    if (familyError) throw familyError;
    if (!family) throw new AppError('Mã gia đình không đúng.');

    const { data: existing, error: existingError } = await admin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) throw new AppError('Tên người chơi đã được sử dụng.');

    const email = syntheticEmail(username);
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { family_id: family.id },
      user_metadata: { display_name: displayName },
    });
    if (createError) {
      const msg = createError.message?.toLowerCase() || '';
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        throw new AppError('Tên người chơi đã được sử dụng.');
      }
      throw createError;
    }
    createdUserId = created.user.id;

    const { error: profileError } = await admin.from('profiles').insert({
      id: createdUserId,
      family_id: family.id,
      username,
      display_name: displayName,
    });
    if (profileError) throw profileError;

    const plots = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) plots.push({ owner_id: createdUserId, row, col });
    }
    const { error: plotsError } = await admin.from('farm_plots').insert(plots);
    if (plotsError) throw plotsError;

    return json({ ok: true, loginKey: email });
  } catch (error) {
    if (createdUserId) {
      try {
        const url = Deno.env.get('SUPABASE_URL')!;
        const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const cleanup = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
        await cleanup.auth.admin.deleteUser(createdUserId);
      } catch { }
    }
    if (error instanceof AppError) return json({ ok: false, error: error.message }, 200);
    console.error('register-player failed', error);
    return json({ ok: false, error: 'Máy chủ đang gặp lỗi. Vui lòng thử lại sau.' }, 500);
  }
});
