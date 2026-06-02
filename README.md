# 🌟 TDC Second-Hand Marketplace - Nền Tảng Mua Bán Đồ Cũ Sinh Viên Tích Hợp AI

**TDC Second-Hand Marketplace** là một hệ sinh thái ứng dụng toàn diện giúp sinh viên trường **Cao đẳng Công nghệ Thủ Đức (TDC)** dễ dàng đăng tin, trao đổi, mua bán và tặng đồ dùng cũ. 

Điểm nổi bật của nền tảng là sự tích hợp của **Trí tuệ nhân tạo (AI)** giúp người dùng tự động sinh mô tả sản phẩm, gợi ý mức giá thanh lý tối ưu, kiểm duyệt chất lượng hình ảnh và phân loại danh mục tự động chỉ bằng một bức ảnh chụp.

---

## 🏗️ Kiến Trúc Hệ Thống (System Architecture)

Dưới đây là sơ đồ luồng hoạt động và kết nối giữa các dịch vụ trong hệ thống:

<p align="center">
  <img src="./assets/architecture.jpg" width="850" alt="Kiến trúc hệ thống TDC Second-Hand Marketplace" />
</p>

### Chi Tiết Thành Phần:
1. **Gemini API (AI Engine):** Đầu não xử lý các tác vụ thông minh (Sinh mô tả, định giá, phân tích chất lượng ảnh, kiểm duyệt nội dung thô tục/spam, sinh vector nhúng cho tính năng tìm kiếm nâng cao).
2. **FastAPI AI Service (Render):** Microservice viết bằng Python đóng vai trò trung gian nhận dữ liệu từ Backend, giao tiếp với Gemini API và phản hồi nhanh chóng qua các API endpoints.
3. **NestJS Backend (Render):** Hệ thống máy chủ trung tâm quản lý logic nghiệp vụ, xác thực người dùng, xử lý các API bán hàng, nhóm cộng đồng, thông báo, và tích hợp Socket.io cho phòng chat thời gian thực.
4. **Neon / Supabase PostgreSQL:** Cơ sở dữ liệu quan hệ lưu trữ dữ liệu sản phẩm, tài khoản, tin nhắn, và lịch sử giao dịch.
5. **Expo EAS - Mobile Client (Mobile App):** Ứng dụng di động đa nền tảng (iOS/Android) mượt mà dành cho người dùng cuối (sinh viên).
6. **Vercel - Admin Web (Web quản trị):** Trang quản trị web trực quan dành cho người điều hành để kiểm duyệt bài đăng, báo cáo, nhóm và người dùng.

---

## 🎨 Thiết Kế Figma (Figma Design)

Quét mã QR dưới đây để xem chi tiết bản thiết kế giao diện (UI/UX) trên Figma của dự án:

<p align="left">
  <img src="./assets/qr_figma.png" width="220" alt="Figma QR Code" />
</p>

---

## 🚀 Tính Năng Nổi Bật (Key Features)

- **🤖 Đăng Tin Thông Minh Bằng AI:** Quét ảnh sản phẩm để tự động nhận diện danh mục, viết mô tả bán hàng chuẩn SEO và gợi ý giá thanh lý phù hợp nhất.
- **📸 Kiểm Duyệt Chất Lượng Hình Ảnh:** AI tự động đánh giá độ nét, ánh sáng, góc chụp và cảnh báo nếu phát hiện ảnh mờ, ảnh mạng hoặc ảnh không phù hợp.
- **💬 Trò Chuyện Thời Gian Thực (Real-time Chat):** Chat trực tiếp giữa người mua và người bán tích hợp gửi ảnh, định vị vị trí và hệ thống Socket.io ổn định.
- **🔔 Thông Báo Tức Thì (Push Notifications):** Đẩy thông báo tức thời khi có tin nhắn mới, có người quan tâm sản phẩm hoặc có hoạt động trong nhóm.
- **👥 Nhóm Trao Đổi Cộng Đồng (Community Groups):** Tham gia hoặc tạo nhóm theo Khoa, Lớp, hoặc Ký túc xá để giao dịch an toàn và tin cậy hơn.
- **🔍 Tìm Kiếm Ngữ Nghĩa (Semantic Search):** Hệ thống tìm kiếm nâng cao dựa trên Vector nhúng giúp tìm kiếm sản phẩm chính xác theo nhu cầu thực tế của người dùng kể cả khi không trùng khớp từ khóa chính xác.
- **🛡️ Bộ Lọc & Kiểm Duyệt:** Lọc tin đăng theo giá, khu vực, tình trạng và tích hợp AI tự động kiểm duyệt nội dung bài viết thô tục, lừa đảo.
- **📊 Bảng Điều Khiển Admin:** Quản trị viên dễ dàng thống kê số lượng bài đăng, quản lý người dùng, xử lý các báo cáo vi phạm.

---

## 🛠️ Công Nghệ Sử Dụng (Technology Stack)

| Thành phần | Công nghệ chính |
| :--- | :--- |
| **Mobile Client** | React Native, Expo SDK 54, TypeScript, NativeWind (Tailwind CSS), React Navigation, Lucide Icons |
| **Admin Web** | React 19, TypeScript, Vite, Tailwind CSS, Axios |
| **Backend API** | NestJS, TypeORM, PostgreSQL, Socket.io, Cloudinary (Lưu trữ ảnh), Nodemailer |
| **AI Service** | Python, FastAPI, Gemini API (`google-generativeai`), Pillow, Uvicorn |
| **Database** | PostgreSQL (Hosted trên Neon / Supabase) |

---

## 📂 Cơ Cấu Thư Mục (Project Structure)

```text
AppDoCu/
├── docu/                # Mã nguồn ứng dụng di động (React Native Expo)
├── backend/deadcells/   # Mã nguồn máy chủ API (NestJS)
├── ai-service/          # Mã nguồn dịch vụ AI (Python FastAPI)
├── admin-web/           # Mã nguồn trang quản trị (React + Vite)
└── assets/              # Tài nguyên hình ảnh, mã QR Figma, sơ đồ kiến trúc
```

---

## 🚦 Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)

### Yêu cầu hệ thống:
* **Node.js** (Phiên bản 18 trở lên)
* **Python** (Phiên bản 3.10 trở lên)
* **Expo CLI** & ứng dụng **Expo Go** trên điện thoại (để test app mobile)

---

### 1. Cài đặt Backend (NestJS)
Di chuyển vào thư mục backend và cài đặt thư viện:
```bash
cd backend/deadcells
npm install
```
Tạo file `.env` dựa theo mẫu cấu hình các biến môi trường:
* Kết nối database PostgreSQL (`DATABASE_URL` hoặc cấu hình Host, Port, Username, Password)
* API Key Cloudinary, Firebase, Mailer, v.v.

Khởi chạy server ở chế độ phát triển:
```bash
npm run start:dev
```
*Mặc định backend sẽ chạy tại: `http://localhost:3000`*

---

### 2. Cài đặt AI Service (Python)
Di chuyển vào thư mục dịch vụ AI và cài đặt các gói phụ thuộc:
```bash
cd ai-service
pip install -r requirements.txt
```
Tạo file `.env` và cấu hình khóa API của Gemini:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
Khởi chạy dịch vụ AI với Uvicorn:
```bash
uvicorn main:app --reload
```
*Mặc định AI service sẽ chạy tại: `http://127.0.0.1:8000`*

---

### 3. Cài đặt Web Quản Trị (Admin Web)
Di chuyển vào thư mục admin-web và cài đặt thư viện:
```bash
cd admin-web
npm install
```
Cấu hình API endpoint trong file `.env` trỏ về Backend NestJS. Sau đó chạy dự án:
```bash
npm run dev
```
*Mặc định web quản trị sẽ chạy tại: `http://localhost:5173`*

---

### 4. Cài đặt Mobile Client (Expo)
Di chuyển vào thư mục ứng dụng di động và cài đặt thư viện:
```bash
cd docu
npm install
```
Mở file `config.ts` để cấu hình địa chỉ IP hoặc domain của Backend NestJS:
```typescript
export const path = "http://<IP_MAY_TINH_CUA_BAN>:3000";
```
Khởi chạy ứng dụng Expo:
```bash
npx expo start
```
*Sử dụng điện thoại quét mã QR hiển thị trên terminal hoặc trình duyệt để mở app qua Expo Go.*

---

## 🤝 Đóng Góp & Phát Triển
Mọi đóng góp, báo lỗi (issue) hoặc yêu cầu tính năng mới đều được chào đón! Vui lòng tạo Issue hoặc gửi Pull Request để cùng hoàn thiện dự án.

## 📄 Giấy Phép (License)
Dự án này được phát triển phục vụ cho mục đích học tập, giảng dạy nghiên cứu chuyên đề và chia sẻ phi thương mại trong cộng đồng sinh viên TDC.
