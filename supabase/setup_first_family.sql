-- Chạy một lần trong Supabase SQL Editor, thay hai giá trị bên dưới.
-- Mã gia đình không được lưu plaintext; chỉ SHA-256 lowercase/trim.
insert into public.families(name, join_code_hash)
values (
  'Gia đình Linh',
  encode(digest(lower(trim('LINHFARM')), 'sha256'), 'hex')
);
