create index if not exists activity_logs_actor_id_idx on public.activity_logs(actor_id);
create index if not exists activity_logs_target_id_idx on public.activity_logs(target_id);
create index if not exists farm_plots_crop_id_idx on public.farm_plots(crop_id);
create index if not exists neighbor_actions_plot_id_idx on public.neighbor_actions(plot_id);
create index if not exists neighbor_actions_target_id_idx on public.neighbor_actions(target_id);

drop policy if exists family_realtime_read on realtime.messages;
drop policy if exists family_realtime_write on realtime.messages;
create policy family_realtime_read on realtime.messages for select to authenticated
using ((select realtime.topic()) = 'family:' || coalesce(((select auth.jwt())->'app_metadata'->>'family_id'),'') and realtime.messages.extension in ('broadcast','presence'));
create policy family_realtime_write on realtime.messages for insert to authenticated
with check ((select realtime.topic()) = 'family:' || coalesce(((select auth.jwt())->'app_metadata'->>'family_id'),'') and realtime.messages.extension in ('broadcast','presence'));
