# Deploy
1. Tạo Supabase project.
2. Chạy migrations theo thứ tự trong `supabase/migrations`.
3. Deploy Edge Function `register-player`; set `SUPABASE_SERVICE_ROLE_KEY` bằng secret server-side.
4. Tạo family đầu tiên bằng SQL admin, dùng SHA-256 lowercase join code cho `join_code_hash`.
5. Copy `.env.example` thành `.env.local`, nhập `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, đặt `VITE_DEMO_MODE=false`.
6. `npm install && npm run build`.
7. Deploy thư mục `dist` lên GitHub Pages/Netlify/Cloudflare Pages.
Lưu ý: GitHub Pages chỉ host frontend; Supabase giữ database/auth/realtime.
