-- Private family Realtime channels. Topic format: family:<family_uuid>
-- family_id is set in auth app_metadata by register-player Edge Function.

drop policy if exists family_realtime_read on realtime.messages;
drop policy if exists family_realtime_write on realtime.messages;

create policy family_realtime_read
on realtime.messages for select to authenticated
using (
  (select realtime.topic()) = 'family:' || coalesce((select auth.jwt()->'app_metadata'->>'family_id'),'')
  and realtime.messages.extension in ('broadcast','presence')
);

create policy family_realtime_write
on realtime.messages for insert to authenticated
with check (
  (select realtime.topic()) = 'family:' || coalesce((select auth.jwt()->'app_metadata'->>'family_id'),'')
  and realtime.messages.extension in ('broadcast','presence')
);
