# Database
Source of truth là Supabase PostgreSQL. Browser không được trực tiếp sửa currency/inventory/crop của người khác.
## Bảng chính
`families`, `profiles`, `crop_catalog`, `farm_plots`, `inventory`, `orders`, `player_materials`, `player_villa_parts`, `neighbor_actions`, `activity_logs`.
## RPC atomic
`plant_crop`, `water_crop`, `harvest_crop`, `sell_item`, `expand_warehouse`, `list_family_neighbors`, `get_neighbor_farm`, `steal_crop`.
## RLS
- Cùng family chỉ đọc phần Farm/public profile cần thiết.
- Inventory/Orders/Materials chỉ chủ sở hữu đọc.
- Không cấp policy UPDATE trực tiếp cho các bảng economy.
