# Discord Job Application Tracker Bot

Bot Discord để theo dõi và quản lý các đơn ứng tuyển việc làm với tích hợp MongoDB và Google Sheets.

## Tính năng

- Theo dõi đơn ứng tuyển với thông tin chi tiết
- Lưu trữ dữ liệu đồng thời trên MongoDB và Google Sheets
- Cập nhật trạng thái đơn ứng tuyển theo thời gian thực
- Tính năng xóa đơn khi cần thiết
- Kiểm soát truy cập dựa trên role Discord
- Tính năng tạo dữ liệu mẫu để test
- Biểu đồ thống kê trực quan
- Xuất dữ liệu ra file CSV

## Danh sách lệnh

### 📝 Quản lý đơn

- `h!apply [công ty] [vị trí] [phương thức] [links] [ghi chú]` - Thêm đơn mới
- `h!update` - Cập nhật trạng thái đơn
- `h!delete` - Xóa đơn ứng tuyển

### 🔍 Tìm kiếm & Xem

- `h!list` - Xem danh sách đơn
- `h!search [field] [query]` - Tìm kiếm đơn
- `h!dashboard` - Xem thống kê
- `h!export` - Xuất dữ liệu ra CSV

### ⚙️ Hệ thống

- `h!helps` - Hiển thị menu trợ giúp
- `h!reload` - Tải lại bot (Admin)
- `h!test` - Thêm dữ liệu mẫu

## Yêu cầu hệ thống

- Node.js (v16.x trở lên)
- MongoDB
- Discord Bot Token
- Google Sheets (thông qua SheetDB)

## Cài đặt

1. Clone repository:

```bash
git clone [repository-url]
cd DiscordBot
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Tạo file `.env` với các biến môi trường:

```env
DISCORD_TOKEN=your_discord_bot_token
MONGODB_URI=your_mongodb_connection_string
SHEETDB_URL=your_sheetdb_api_url
ALLOWED_ROLE_ID=your_discord_role_id
```

## Cấu trúc dự án

```
DiscordBot/
├── commands/
│   └── reload.js
├── models/
│   └── Application.js
├── config/
│   └── database.js
├── commands.js
├── index.js
├── package.json
└── .env
```

## Cấu hình

### Discord Bot

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Tạo application mới
3. Thêm bot
4. Bật Intents cần thiết (Server Members, Message Content)
5. Copy token vào file .env

### MongoDB

1. Tạo database MongoDB (local hoặc Atlas)
2. Copy connection string vào file .env

### Google Sheets

1. Tạo Google Sheet với các cột:
   - Công ty
   - Vị trí ứng tuyển
   - Ngày nộp đơn
   - Phương thức ứng tuyển
   - Links
   - Trạng thái
   - Ghi chú
2. Thiết lập SheetDB và copy API URL vào file .env

## Các trạng thái đơn

- Đã nộp
- Hẹn phỏng vấn
- Đã phỏng vấn
- Trượt

## Chạy bot

```bash
node index.js
```

## Đóng góp

1. Fork dự án
2. Tạo branch mới
3. Commit thay đổi
4. Push lên branch
5. Tạo Pull Request

## License

[MIT License](LICENSE)

## Tác giả

tienhieu03

## Hỗ trợ

Nếu bạn gặp vấn đề, vui lòng tạo issue trong repository.
