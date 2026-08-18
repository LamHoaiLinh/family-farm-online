# Asset cần tạo – Đợt 1
Hiện bản MVP vẽ bằng Canvas nên chạy được không cần asset. Để đẹp gần tinh thần game farm mobile, ưu tiên tạo các asset sau.

## ASSET 01 – Nhà chính
- Tên file: `building_farmhouse_lv1.png`
- Loại: Công trình chính
- Kích thước source: 1024×1024 px
- Định dạng: PNG hoặc WebP; nền trong suốt
- Góc nhìn: 3/4 từ trên xuống
- Camera: cao 32–35°, nhìn từ Đông Nam về Tây Bắc
- Phối cảnh: 2.5D/isometric nhẹ
- Ánh sáng: trên-trái; bóng mềm xuống-phải
- Padding: 10%; anchor giữa đáy
- Không chữ, không người, không crop mất mái/bóng

## ASSET 02 – Nhà kho
- Tên file: `building_barn_lv1.png`
- Kích thước: 1024×1024 px; PNG/WebP transparent
- Cùng camera/ánh sáng/anchor với Nhà chính

## ASSET 03 – Giếng nước
- Tên file: `building_well_lv1.png`
- Kích thước: 768×768 px; transparent
- Cùng góc nhìn chuẩn

## ASSET 04 – Chuồng chó
- Tên file: `building_dog_house_lv1.png`
- Kích thước: 768×768 px; transparent
- Cùng góc nhìn chuẩn

## ASSET 05 – Đất ruộng isometric
- Tên file: `tile_soil_plowed.png`
- Kích thước: 256×128 px
- Diamond tile; nền trong suốt; không cây

## ASSET 06 – Đất ướt
- Tên file: `tile_soil_watered.png`
- Kích thước: 256×128 px
- Cùng hình học với tile đất thường; màu tối hơn vừa phải

## ASSET 07 – Cổng nông trại
- Tên file: `decor_farm_gate_lv1.png`
- Kích thước: 768×768 px; transparent

## ASSET 08 – Xe tải chuyển cảnh
- Tên file: `vehicle_farm_truck.png`
- Kích thước: 768×512 px; transparent
- Góc 3/4 tương thích camera world; đầu xe hướng chếch Tây Bắc

# Asset cây
Không cần tạo 20×5 ảnh ngay. Renderer hiện dùng Canvas procedural. Khi cần nâng hình ảnh, mỗi cây nên có 5 stage trong một sprite sheet:
- Tên: `crop_<id>_stages.png`
- Kích thước: 5 frame × 256×256 = 1280×256 px
- Mỗi frame 256×256, transparent
- Stage: gieo / nảy mầm / cây non / gần chín / chín
- Góc nhìn 3/4 top-down 32–35°, nguồn sáng đồng nhất.
Ưu tiên tạo trước: cà rốt, bắp, cà chua, dâu tây, dưa hấu, xoài.
