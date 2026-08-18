# Nông Trại Gia Đình Online
MVP web game landscape 16:9 dành cho 5–20 thành viên gia đình. Frontend Canvas/Vite/TypeScript; dữ liệu thiết kế cho Supabase PostgreSQL/Auth/RPC/Realtime.

## Chạy ngay không cần Supabase
```bash
npm install
cp .env.example .env.local
npm run dev
```
Giữ `VITE_DEMO_MODE=true`. Bản demo có gieo, tưới, thu hoạch, kho, bán, mở kho bằng Kim Cương, ghé hàng xóm và hái trộm mô phỏng.

## Kết nối Supabase
Xem `docs/DEPLOYMENT.md`. Sau khi chạy migrations, deploy Edge Function `register-player` và tạo Family đầu tiên, đặt `VITE_DEMO_MODE=false`. Tên người chơi hiện được thiết kế duy nhất toàn hệ thống để đăng nhập chỉ cần Tên + Mật khẩu.

## Nguồn tham khảo
- `grow-your-garden-master.zip`: repository MIT; tham khảo kiến trúc web/canvas/multiplayer. Bản mới không phụ thuộc backend Node/SQLite của source cũ.
- `QQ-Farm-main.zip`: không thấy LICENSE trong ZIP; không copy code/asset. Chỉ học cơ chế social farm/steal/concurrency.

## Trạng thái v0.1
Đã có: landscape/PWA shell, 20 crop config, Canvas farm, demo offline, schema/RLS/RPC Supabase nền tảng, neighbor visit/steal transaction, asset specification.
Chưa hoàn thiện: UI auth thật, Realtime Presence/Broadcast, order generator/cooldown RPC, disease/death scheduler, Diamond recipes, 30–50 Villa parts, sound/animation production, production security audit.
