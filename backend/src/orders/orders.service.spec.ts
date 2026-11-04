import { NotFoundException } from '@nestjs/common';
import type { Payment } from '../generated/prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

describe('ordersService', () => {
  let service: OrdersService;

  const taoYeuCauTaoDon = (): CreateOrderDto => ({
    userId: 'user-1',
    items: [
      {
        id: 'item-1',
        productId: 'espresso',
        name: 'Espresso',
        imageUrl: 'https://example.com/espresso.jpg',
        size: 'M',
        toppings: [],
        qty: 2,
        unitPrice: 45000,
        lineTotal: 90000,
      },
    ],
    total: 90000,
  });

  beforeEach(() => {
    service = new OrdersService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('tạo đơn hàng với trạng thái PENDING và dữ liệu đúng định dạng', () => {
      jest.spyOn(Date, 'now').mockReturnValue(12345678);

      const donHang = service.create(taoYeuCauTaoDon());

      expect(donHang).toEqual({
        id: 'BL-12345678',
        userId: 'user-1',
        items: [
          {
            id: 'item-1',
            orderId: 'BL-12345678',
            productId: 'espresso',
            name: 'Espresso',
            imageUrl: 'https://example.com/espresso.jpg',
            size: 'M',
            toppings: [],
            qty: 2,
            unitPrice: 45000,
            lineTotal: 90000,
          },
        ],
        total: 90000,
        status: 'PENDING',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        payments: [],
      });
      expect(donHang?.items[0].unitPrice).toBe(45000);
    });

    it('thêm đơn hàng mới vào đầu danh sách', () => {
      const donHangDau = service.create(taoYeuCauTaoDon());
      const donHangMoi = service.create({
        ...taoYeuCauTaoDon(),
        userId: 'user-2',
      });

      expect(service.findMine()).toEqual([donHangMoi, donHangDau]);
    });
  });

  describe('findMine', () => {
    it('trả về danh sách rỗng khi chưa có đơn hàng', () => {
      expect(service.findMine()).toEqual([]);
    });

    it('trả về các đơn hàng đã tạo', () => {
      const donHang = service.create(taoYeuCauTaoDon());
      expect(donHang).toBeDefined();
      if (!donHang) return;

      expect(service.findMine()).toContain(donHang);
    });
  });

  describe('updateStatus', () => {
    it('cập nhật trạng thái đơn hàng và lưu thông tin thanh toán', () => {
      const donHang = service.create(taoYeuCauTaoDon());
      expect(donHang).toBeDefined();
      if (!donHang) return;
      const thanhToan: Payment = {
        id: 'payment-1',
        orderId: donHang.id,
        idempotencyKey: 'payment-key-1',
        amount: 90000,
        method: 'mock',
        createdAt: new Date('2026-11-04T00:00:00.000Z'),
      };

      const donHangSauCapNhat = service.updateStatus(
        donHang.id,
        'PAID',
        thanhToan,
      );
      const donHangTruyVanLai = service
        .findMine()
        .find((donHangDuocTim) => donHangDuocTim.id === donHang.id);

      expect(donHangSauCapNhat.status).toBe('PAID');
      expect(donHangSauCapNhat.payments).toEqual([thanhToan]);
      expect(donHangTruyVanLai?.status).toBe('PAID');
      expect(donHangTruyVanLai?.payments).toEqual([thanhToan]);
    });

    it('ném NotFoundException khi đơn hàng không tồn tại', () => {
      expect(() => service.updateStatus('khong-ton-tai', 'PAID')).toThrow(
        NotFoundException,
      );
    });
  });
});
