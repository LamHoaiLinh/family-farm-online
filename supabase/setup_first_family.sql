-- Mẫu tạo family đầu tiên. KHÔNG commit mã gia đình thật vào GitHub.
-- Chạy một lần trong môi trường quản trị và thay __FAMILY_JOIN_CODE__ bằng mã riêng.
insert into public.families(name, join_code_hash)
values ('Gia đình Linh', encode(digest(lower(trim('__FAMILY_JOIN_CODE__')), 'sha256'), 'hex'))
on conflict (join_code_hash) do nothing;
