// import { ConflictException } from '@nestjs/common';
// import type { OrderStatus } from '../generated/prisma/client';
// import { OrdersService } from './orders.service';
// describe('OrdersService', () => {
//   const service = new OrdersService({} as never, {} as never);

//   //1.CHUYỂN TRẠNG THÁI HỢP LỆ

//   // Chờ thanh toán → Đã thanh toán
//   it('cho phép PENDING → PAID', () => {
//     expect(() =>
//       service.assertTransition('PENDING' as OrderStatus, 'PAID' as OrderStatus),
//     ).not.toThrow();
//   });

//   // Đã thanh toán → Đang chuẩn bị
//   it('cho phép PAID → PREPARING', () => {
//     expect(() =>
//       service.assertTransition('PAID' as OrderStatus, 'PREPARING' as OrderStatus),
//     ).not.toThrow();
//   });

//   // Đang chuẩn bị → Sẵn sàng
//   it('cho phép PREPARING → READY', () => {
//     expect(() =>
//       service.assertTransition('PREPARING' as OrderStatus, 'READY' as OrderStatus),
//     ).not.toThrow();
//   });

//   // Sẵn sàng → Hoàn thành
//   it('cho phép READY → COMPLETED', () => {
//     expect(() =>
//       service.assertTransition('READY' as OrderStatus, 'COMPLETED' as OrderStatus),
//     ).not.toThrow();
//   });

//   // Chờ thanh toán → Thanh toán thất bại
//   it('cho phép PENDING → PAYMENT_FAILED', () => {
//     expect(() =>
//       service.assertTransition('PENDING' as OrderStatus, 'PAYMENT_FAILED' as OrderStatus),
//     ).not.toThrow();
//   });

//   // Thanh toán thất bại → Chờ thanh toán lại
//   it('cho phép PAYMENT_FAILED → PENDING', () => {
//     expect(() =>
//       service.assertTransition('PAYMENT_FAILED' as OrderStatus, 'PENDING' as OrderStatus),
//     ).not.toThrow();
//   });

//   //2. HỦY ĐƠN HÀNG

//   // Hủy đơn đang chờ thanh toán
//   it('cho phép PENDING → CANCELLED', () => {
//     expect(() =>
//       service.assertTransition('PENDING' as OrderStatus, 'CANCELLED' as OrderStatus),
//     ).not.toThrow();
//   });

//   // Hủy đơn đã thanh toán (nếu hệ thống cho phép)
//   it('cho phép PAID → CANCELLED', () => {
//     expect(() =>
//       service.assertTransition('PAID' as OrderStatus, 'CANCELLED' as OrderStatus),
//     ).not.toThrow();
//   });

//   it('cho phép PAYMENT_FAILED → CANCELLED', () => {
//     expect(() =>
//       service.assertTransition('PAYMENT_FAILED' as OrderStatus, 'CANCELLED' as OrderStatus),
//     ).not.toThrow();
//   });

//   //3. CHUYỂN TRẠNG THÁI KHÔNG HỢP LỆ 

//   it('từ chối chuyển trạng thái đơn hàng không hợp lệ', () => {
//     expect(() =>
//       service.assertTransition('PENDING' as OrderStatus, 'READY' as OrderStatus),
//     ).toThrow(ConflictException);
//   });
//   // Không cho phép bỏ qua bước chuẩn bị đơn
//   it('từ chối PAID → COMPLETED', () => {
//     expect(() =>
//       service.assertTransition('PAID' as OrderStatus, 'COMPLETED' as OrderStatus),
//     ).toThrow(ConflictException);
//   });

//   // Đơn đã hoàn thành không được quay lại chờ thanh toán
//   it('từ chối COMPLETED → PENDING', () => {
//     expect(() =>
//       service.assertTransition('COMPLETED' as OrderStatus, 'PENDING' as OrderStatus),
//     ).toThrow(ConflictException);
//   });

//   // Đơn đã hoàn thành không được chuyển về đã thanh toán
//   it('từ chối COMPLETED → PAID', () => {
//     expect(() =>
//       service.assertTransition('COMPLETED' as OrderStatus, 'PAID' as OrderStatus),
//     ).toThrow(ConflictException);
//   });

//   // Đơn đã hoàn thành không được hủy
//   it('từ chối COMPLETED → CANCELLED', () => {
//     expect(() =>
//       service.assertTransition('COMPLETED' as OrderStatus, 'CANCELLED' as OrderStatus),
//     ).toThrow(ConflictException);
//   });

//   // Đơn đã hủy không được quay lại chờ thanh toán
//   it('từ chối CANCELLED → PENDING', () => {
//     expect(() =>
//       service.assertTransition('CANCELLED' as OrderStatus, 'PENDING' as OrderStatus),
//     ).toThrow(ConflictException);
//   });

//   // Đơn đã hủy không được chuyển sang đã thanh toán
//   it('từ chối CANCELLED → PAID', () => {
//     expect(() =>
//       service.assertTransition('CANCELLED' as OrderStatus, 'PAID' as OrderStatus),
//     ).toThrow(ConflictException);
//   });

//   // Đơn đã hủy không được chuyển sang hoàn thành
//   it('từ chối CANCELLED → COMPLETED', () => {
//     expect(() =>
//       service.assertTransition('CANCELLED' as OrderStatus, 'COMPLETED' as OrderStatus),
//     ).toThrow(ConflictException);
//   });

// });
