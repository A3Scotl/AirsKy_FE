# AirSky - Nền tảng Đặt vé máy bay Trực tuyến

![AirSky Logo](https://res.cloudinary.com/dzwjgfd7t/image/upload/v1755141382/flight%20booking/main_logo-removebg_xyofym.png)

**AirSky** là một dự án ứng dụng web hoàn chỉnh, cung cấp giải pháp đặt vé máy bay trực tuyến một cách nhanh chóng, tiện lợi và an toàn. Dự án được xây dựng với mục tiêu mang lại trải nghiệm người dùng mượt mà và một hệ thống quản trị mạnh mẽ, linh hoạt cho các đối tác kinh doanh và quản trị viên.

**Link Demo:** [https://airsky.online/](https://airsky.online/)

---

## ✨ Tính năng nổi bật

Dự án được chia thành hai phần chính: giao diện cho người dùng (khách hàng) và trang quản trị cho admin/đối tác.

### 👤 Dành cho Người dùng (Khách hàng)

- **Tìm kiếm & Đặt vé thông minh:**
  - Tìm kiếm chuyến bay một chiều, khứ hồi.
  - Lọc và sắp xếp kết quả tìm kiếm theo nhiều tiêu chí (giá, thời gian bay, hãng hàng không).
  - Giao diện tìm kiếm thân thiện, dễ sử dụng.
- **Quản lý tài khoản cá nhân:**
  - Đăng ký, đăng nhập, xác thực tài khoản qua email, đăng nhập bằng Google.
  - Quản lý thông tin cá nhân, cập nhật ảnh đại diện.
  - Thay đổi mật khẩu và bảo mật tài khoản.
- **Quản lý Đặt chỗ:**
  - Xem lại lịch sử các chuyến bay đã đặt.
  - Lọc, tìm kiếm và sắp xếp các đơn đặt chỗ theo ngày, trạng thái, giá.
  - Xem chi tiết thông tin chuyến bay, hành khách.
- **Thanh toán An toàn & Đa dạng:**
  - Hỗ trợ thanh toán qua PayPal và chuyển khoản ngân hàng (QR Code).
  - Xử lý thanh toán an toàn và cập nhật trạng thái đơn hàng tự động.
- **Chương trình Khách hàng thân thiết:**
  - Tích điểm sau mỗi chuyến bay hoàn thành.
  - Phân hạng thành viên (Standard, Silver, Gold, Platinum) với các quyền lợi khác nhau.
  - Theo dõi tiến độ lên hạng.
- **Đánh giá chuyến bay:**
  - Người dùng có thể để lại đánh giá (rating & comment) sau khi hoàn thành chuyến bay.
- **Tương tác & Hỗ trợ:**
  - Tích hợp Chatbot AI để hỗ trợ và giải đáp thắc mắc của người dùng.

### ⚙️ Dành cho Quản trị viên & Đối tác (Admin/Business)

- **Dashboard Tổng quan:**
  - Biểu đồ và số liệu thống kê trực quan về doanh thu, số lượng đặt vé, người dùng mới.
- **Quản lý Đặt vé (Bookings):**
  - Xem danh sách tất cả các đơn đặt vé trong hệ thống.
  - Tìm kiếm và lọc nâng cao theo nhiều tiêu chí.
  - Xem chi tiết và quản lý trạng thái của từng đơn hàng.
- **Quản lý Người dùng (Users):**
  - Quản lý danh sách người dùng, phân quyền (Admin, Business, Customer).
  - Thêm, sửa, xóa và khóa/mở khóa tài khoản người dùng.
- **Quản lý Chuyến bay (Flights):**
  - Quản lý toàn diện: chuyến bay, sân bay, hãng bay, máy bay, hạng vé.
- **Quản lý Nội dung (CMS):**
  - Quản lý bài đăng (blogs) và các danh mục (categories) cho trang tin tức.
- **Phân quyền (Role-Based Access Control):**
  - Giao diện và chức năng được tùy chỉnh dựa trên vai trò (`ADMIN` có toàn quyền, `BUSINESS` có quyền giới hạn).

---

## 🚀 Công nghệ sử dụng

Dự án được xây dựng trên các công nghệ hiện đại và mạnh mẽ.

### Frontend

- **Framework:** React.js
- **State Management:** Zustand & React Query (cho Server State)
- **Routing:** React Router DOM
- **UI Framework:** Tailwind CSS
- **UI Components:** shadcn/ui - Bộ component được xây dựng trên Radix UI và Tailwind CSS.
- **Styling:** CSS Modules, PostCSS.
- **API Client:** Axios
- **Icons:** Lucide React
- **Animation:** Framer Motion
- **Notifications:** Sonner
- **Build Tool:** Vite


## 🛠️ Hướng dẫn Cài đặt & Chạy dự án

Để chạy dự án trên máy của bạn, hãy làm theo các bước sau:

### Yêu cầu

- Node.js (phiên bản 18.x trở lên)
- npm hoặc yarn

### Cài đặt

1.  **Clone repository:**
    ```bash
    git clone <your-repository-url>
    cd AirsKy_FE
    ```

2.  **Cài đặt các dependencies:**
    ```bash
    npm install
    # hoặc
    yarn install
    ```

3.  **Cấu hình biến môi trường:**

    Tạo một file `.env` ở thư mục gốc của dự án và thêm các biến môi trường cần thiết. Ví dụ:

    ```env
    VITE_API_BASE_URL=http://localhost:8080/api/v1
    VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
    ```

4.  **Chạy dự án:**
    ```bash
    npm run dev
    # hoặc
    yarn dev
    ```

    Ứng dụng sẽ chạy tại địa chỉ `http://localhost:5173`.

---

## 📂 Cấu trúc thư mục

Cấu trúc thư mục của frontend được tổ chức một cách khoa học để dễ dàng bảo trì và mở rộng.

