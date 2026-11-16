# Traceability Matrix

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
|---|---|---|---|---|
| FR-01 | US-01 Xem menu | Activity-01, Class-01 | GET /products | API-T01 |
| FR-02 | US-02 Xem chi tiết sản phẩm | Activity-01, Class-01 | GET /products/:id | API-T02 |
| FR-03 | US-03 Chọn size và topping | Activity-02, Class-02 | Frontend ProductView | E2E-T01 |
| FR-04 | US-04 Quản lý giỏ hàng | Activity-03, Class-03 | Frontend CartView | E2E-T01 |
| FR-05 | UC-01 Đặt đơn hàng | Sequence-01, Class-04 | POST /orders | INT-T01 |
| FR-06 | UC-02 Thanh toán | Sequence-01, Class-05 | POST /payments | INT-T02 |
| FR-07 | US-05 Theo dõi đơn hàng | Activity-04, Class-04 | GET /orders/me | API-T03 |
| FR-08 | US-06 Đăng ký tài khoản | Sequence-02, Class-06 | POST /auth/register | API-T04 |
| FR-09 | US-07 Đăng nhập | Sequence-02, Class-06 | POST /auth/login | API-T05 |
| FR-10 | US-08 Áp dụng khuyến mãi | Activity-05, Class-07 | POST /promotions/validate | API-T06 |
| NFR-01 | — Mobile-first/PWA | Architecture-01 | Next.js standalone output | — |
| NFR-02 | — Hiệu năng API | Architecture-01 | NestJS + PostgreSQL | Load-T01 |
