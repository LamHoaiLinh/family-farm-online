# Phân tích hai source đầu vào
## 1. grow-your-garden-master.zip
- Có `LICENSE` MIT, copyright 2025 Avi (Gmast).
- Kiến trúc cũ: HTML/CSS/JavaScript + Node/Express + Socket.IO + SQLite/JWT/bcrypt.
- `game.js` có hệ cây, watering/fertilizer, sprinkler, season/weather và Canvas.
- Renderer cây trong bản ZIP chủ yếu vẽ soil + emoji stage trên Canvas, không phải bộ sprite raster hoàn chỉnh.
- `multiplayer.js`/`server.js` có friend system, garden update, request/response cho visit garden.
- Có nhiều script fix/admin/debug; không nên bê toàn bộ backend vào game mới vì Supabase thay thế phần server/database/auth.
### Phần giữ ý tưởng/tái sử dụng hợp lý
- data-driven crop progression;
- Canvas render loop;
- friend/garden visit event model;
- UI/mobile lessons.
### Phần không mang sang
- SQLite local/server database;
- admin/fix scripts;
- JWT custom auth;
- Node Socket.IO backend, vì Supabase đảm nhiệm server state/realtime.

## 2. QQ-Farm-main.zip
- Java + JavaFX + TCP socket; không phải web.
- Có client/server/common và test concurrency.
- `FarmManager.steal()` kiểm tra không tự trộm mình, owner watching, ripe crop, steal history và đồng bộ bằng `synchronized`.
- `StealConcurrencyTest` kiểm tra nhiều yêu cầu trộm đồng thời.
- Asset raster: farmer 32×32; crop 18×18; plot/tile/fence/decor 16×16, phong cách pixel/isometric.
- Không thấy LICENSE/COPYING/NOTICE trong ZIP, do đó game mới không copy code/PNG của QQ-Farm.
### Phần học cơ chế
- server-authoritative steal;
- khóa transaction khi nhiều người thao tác đồng thời;
- giới hạn một người trộm trong một đợt cây;
- chủ đang xem vườn có thể làm hành động trộm thất bại;
- GET_FARM/GET_PLAYERS như mô hình visit/social.

## 3. Kiến trúc mới
- Frontend: Vite + TypeScript + Canvas 2D + PWA, viewport 1280×720 landscape.
- Backend: Supabase Auth/PostgreSQL/RLS/RPC/Edge Functions/Realtime (Realtime chưa bật ở MVP v0.1).
- Source of truth: PostgreSQL; client chỉ gửi ý định action.
- Asset QQ-Farm không được đưa vào build.
