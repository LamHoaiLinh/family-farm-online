import type { RealtimeChannel } from '@supabase/supabase-js';
import { demoMode, supabase } from './supabase';

let channel: RealtimeChannel | null = null;

export async function startFamilyRealtime(onFarmEvent?: (payload: any) => void) {
  if (demoMode || !supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('family_id,display_name')
    .eq('id', user.id)
    .single();
  if (error || !profile?.family_id) throw error ?? new Error('Không tìm thấy gia đình của người chơi.');

  if (channel) await supabase.removeChannel(channel);
  const topic = `family:${profile.family_id}`;
  channel = supabase.channel(topic, {
    config: { private: true, presence: { key: user.id } },
  });

  channel
    .on('broadcast', { event: 'farm_event' }, ({ payload }: { payload: any }) => onFarmEvent?.(payload))
    .subscribe(async (status: string) => {
      if (status !== 'SUBSCRIBED') return;
      await channel?.track({
        user_id: user.id,
        name: profile.display_name,
        online_at: new Date().toISOString(),
      });
    });

  return channel;
}

export async function broadcastFarmEvent(payload: Record<string, unknown>) {
  if (!channel) return;
  await channel.send({ type: 'broadcast', event: 'farm_event', payload });
}

export async function stopFamilyRealtime() {
  if (!channel || !supabase) return;
  try { await channel.untrack(); } catch { /* noop */ }
  await supabase.removeChannel(channel);
  channel = null;
}
