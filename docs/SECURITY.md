# Security
- PostgreSQL/Supabase là source of truth cho Gold, Diamond, EXP, inventory, crop timers và steal.
- Client dùng publishable key + Supabase Auth + RLS.
- Service role không có trong frontend/GitHub.
- Các implementation có đặc quyền nằm trong schema `private`; public RPC chỉ là `SECURITY INVOKER` wrapper và chỉ `authenticated` được EXECUTE.
- RLS cùng-family áp dụng cho profile/farm/villa/log; inventory/orders/materials chỉ chủ sở hữu đọc.
- Bảng `families` cố ý không có client policy: join-code hash chỉ Edge Function/admin được đọc.
- Timestamp database quyết định crop maturity; đổi giờ iPhone không làm cây chín.
- `steal_crop` khóa plot `FOR UPDATE`, chặn trộm lại cùng crop cycle và giới hạn tổng phần bị lấy.
- Realtime dùng private channel `family:<family_id>`; quyền channel lấy từ `app_metadata.family_id`, không dùng `user_metadata` để phân quyền.
- Default privileges trong `public` đã được revoke để object mới không tự mở ra Data API.

## Việc còn cần trước khi mở rộng ra ngoài gia đình
- rate limit đăng ký theo IP/family code;
- cơ chế admin reset mật khẩu/tài khoản;
- audit logging sâu hơn;
- automated RLS integration tests.
