-- Family ownership and join-code management.

create unique index if not exists families_join_code_hash_unique
  on public.families(join_code_hash);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'families_created_by_fkey'
  ) then
    alter table public.families
      add constraint families_created_by_fkey
      foreign key (created_by) references auth.users(id) on delete set null;
  end if;
end $$;

create or replace function private.is_family_owner_impl()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.profiles p
    join public.families f on f.id=p.family_id
    where p.id=(select auth.uid()) and f.created_by=p.id
  )
$$;

create or replace function private.change_family_join_code_impl(p_new_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_family_id uuid;
  v_code text := lower(trim(p_new_code));
  v_hash text;
begin
  if v_uid is null then raise exception 'Bạn chưa đăng nhập'; end if;
  if length(v_code) < 5 or length(v_code) > 40 or v_code !~ '^[a-z0-9_-]+$' then
    raise exception 'Mã gia đình phải dài 5–40 ký tự, chỉ gồm chữ không dấu, số, _ hoặc -';
  end if;

  select p.family_id into v_family_id
  from public.profiles p where p.id=v_uid;
  if v_family_id is null then raise exception 'Không tìm thấy gia đình của bạn'; end if;

  if not exists(select 1 from public.families f where f.id=v_family_id and f.created_by=v_uid) then
    raise exception 'Chỉ Chủ gia đình mới được đổi Mã gia đình';
  end if;

  v_hash := encode(digest(v_code, 'sha256'), 'hex');
  begin
    update public.families set join_code_hash=v_hash where id=v_family_id;
  exception when unique_violation then
    raise exception 'Mã gia đình này đã được một gia đình khác sử dụng';
  end;
end$$;

revoke all on function private.is_family_owner_impl() from public, anon;
revoke all on function private.change_family_join_code_impl(text) from public, anon;
grant execute on function private.is_family_owner_impl(), private.change_family_join_code_impl(text) to authenticated;

create or replace function public.is_family_owner()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$select private.is_family_owner_impl()$$;

create or replace function public.change_family_join_code(p_new_code text)
returns void
language sql
security invoker
set search_path = ''
as $$select private.change_family_join_code_impl(p_new_code)$$;

revoke execute on function public.is_family_owner(), public.change_family_join_code(text) from public, anon;
grant execute on function public.is_family_owner(), public.change_family_join_code(text) to authenticated;
