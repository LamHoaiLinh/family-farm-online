# Security
- Service role chỉ dùng trong Supabase Edge Function secret.
- Client dùng anon/publishable key + RLS.
- Timestamp server/database quyết định crop maturity và cooldown.
- Harvest/steal/sell/expand warehouse là RPC SECURITY DEFINER và kiểm tra `auth.uid()`.
- `steal_crop` khóa plot `FOR UPDATE`, unique index chặn cùng người trộm lại cùng crop cycle.
- Cần hardening trước production: revoke execute mặc định trên helper function, rà soát search_path, rate limit Edge Function, giới hạn RPC grants, thêm audit tests.
