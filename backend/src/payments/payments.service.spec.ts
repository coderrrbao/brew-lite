import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type {
  OrderStatus,
  Payment,
} from '../generated/prisma/client';
import { OrdersService, type OrderWithRelations } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

describe('paymentsService', () => {
  let service: PaymentsService;
  let module: TestingModule;
  let hoaDon: OrderWithRelations;
  let ordersServiceMock: {
    findMine: jest.Mock;
    updateStatus: jest.Mock;
  };

  const taoYeuCauThanhToan = (success: boolean): CreatePaymentDto => ({
    orderId: 'BL-12345678',
    idempotencyKey: `kiem-tra-${success}`,
    success,
  });

  beforeEach(async () => {
    hoaDon = {
      id: 'BL-12345678',
      userId: 'user-1',
      items: [],
      total: 90000,
      status: 'PENDING',
      createdAt: new Date('2026-11-04T00:00:00.000Z'),
      updatedAt: new Date('2026-11-04T00:00:00.000Z'),
      payments: [],
    };

    ordersServiceMock = {
      findMine: jest.fn(() => [hoaDon]),
      updateStatus: jest.fn(
        (id: string, status: OrderStatus, payment?: Payment) => {
          if (hoaDon.id !== id) {
            throw new Error('Không tìm thấy hóa đơn');
          }

          hoaDon.status = status;
          if (payment) hoaDon.payments.push(payment);

          return hoaDon;
        },
      ),
    };

    module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: OrdersService, useValue: ordersServiceMock },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('đổi trạng thái hóa đơn thành PAID khi thanh toán thành công', async () => {
    expect(ordersServiceMock.findMine()[0].status).toBe('PENDING');

    await service.pay(taoYeuCauThanhToan(true));

    const hoaDonSauThanhToan = ordersServiceMock
      .findMine()
      .find(
        (hoaDonDuocTim: OrderWithRelations) =>
          hoaDonDuocTim.id === 'BL-12345678',
      );

    expect(hoaDonSauThanhToan?.status).toBe('PAID');
    expect(ordersServiceMock.updateStatus).toHaveBeenCalled();
    expect(ordersServiceMock.updateStatus.mock.calls[0][0]).toBe('BL-12345678');
    expect(ordersServiceMock.updateStatus.mock.calls[0][1]).toBe('PAID');
  });

  it('đổi trạng thái hóa đơn thành PAYMENT_FAILED khi thanh toán thất bại', async () => {
    expect(ordersServiceMock.findMine()[0].status).toBe('PENDING');

    await service.pay(taoYeuCauThanhToan(false));

    const hoaDonSauThanhToan = ordersServiceMock
      .findMine()
      .find(
        (hoaDonDuocTim: OrderWithRelations) =>
          hoaDonDuocTim.id === 'BL-12345678',
      );

    expect(hoaDonSauThanhToan?.status).toBe('PAYMENT_FAILED');
    expect(ordersServiceMock.updateStatus).toHaveBeenCalled();
    expect(ordersServiceMock.updateStatus.mock.calls[0][0]).toBe('BL-12345678');
    expect(ordersServiceMock.updateStatus.mock.calls[0][1]).toBe(
      'PAYMENT_FAILED',
    );
  });

  it('từ chối yêu cầu thanh toán dùng lại idempotencyKey đã xử lý', async () => {
    const yeuCau = {
      ...taoYeuCauThanhToan(true),
      idempotencyKey: 'payment-key-duplicate',
    };

    await service.pay(yeuCau);
    await expect(service.pay(yeuCau)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(ordersServiceMock.updateStatus).toHaveBeenCalledTimes(1);
  });
});
