# Deploy production
## Supabase đang dùng
- Project: `family-farm-online`
- Region: Singapore (`ap-southeast-1`)
- Frontend dùng publishable key trong `.env.production`.
- Service role chỉ tồn tại trong môi trường Edge Function của Supabase.

## Database
Các migration `001`–`005` phải được áp theo thứ tự. Project production hiện đã được áp các migration tương ứng và có 20 cây seed.

## Tài khoản gia đình
Giao diện dùng Tên người chơi + Mật khẩu. Khi đăng ký thêm Mã gia đình. Edge Function `register-player` tạo Auth user, profile và 24 ô đất. Mã gia đình thật không được commit vào repository.

## GitHub Pages
Workflow `.github/workflows/deploy-pages.yml` chạy khi push `main`:
1. `npm install`
2. `npm test`
3. `npm run build`
4. upload `dist`
5. deploy Pages

Nếu workflow báo Pages chưa được bật: GitHub repo → Settings → Pages → Build and deployment → Source → chọn **GitHub Actions**, rồi chạy lại workflow.

## PWA / iPhone
Sau khi Pages hoạt động, mở URL bằng Safari, xoay ngang và có thể chọn Share → Add to Home Screen. Orientation lock không được giả định luôn hoạt động trên Safari; ứng dụng có overlay yêu cầu xoay ngang.
