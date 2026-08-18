# Nông Trại Gia Đình Online
Web game nông trại online dành cho gia đình, landscape 16:9, Canvas/PWA + Supabase.

## Production backend
Supabase project riêng `family-farm-online` đã được tạo ở Singapore. Database/RLS/RPC/Realtime và Edge Function đăng ký đã được triển khai. Frontend production lấy cấu hình từ `.env.production` bằng publishable key.

## Chạy local
```bash
npm install
npm run dev
```
`.env.production` là cấu hình production; để thử local không đụng dữ liệu thật có thể tạo `.env.local` với `VITE_DEMO_MODE=true`.

## Gameplay MVP
- 20 cây mở dần theo cấp.
- trồng → tưới → chín → thu hoạch vào Kho.
- kho mặc định 50; 1 Kim Cương = +5 chỗ.
- hàng xóm cùng Family, ghé thăm và hái trộm một phần nhỏ cây chín.
- server/database xác nhận các transaction kinh tế.
- private Realtime channel theo Family đã chuẩn bị ở backend.

## Tài khoản
Đăng nhập: Tên người chơi + Mật khẩu.
Đăng ký: thêm Tên hiển thị + Mã gia đình.
Không cần email/OTP ở giao diện.

## Nguồn tham khảo
- Grow Your Garden: source ZIP có MIT; dùng để nghiên cứu kiến trúc/web gameplay.
- QQ-Farm: ZIP không có LICENSE; không copy code/asset, chỉ học cơ chế social/steal/concurrency.

## Chưa hoàn chỉnh
- đơn hàng generator/cooldown thật;
- tưới giúp hàng xóm;
- kết nối Presence/Broadcast vào toàn bộ UI;
- bệnh/chết cây theo server time;
- recipe đổi Kim Cương + speed upgrades;
- Nhà Vườn 30–50 hạng mục;
- chó giữ vườn/bắt quả tang;
- production asset/sound.

Xem `docs/DEPLOYMENT.md`, `docs/SECURITY.md`, `docs/ASSET_CAN_TAO.md`.
