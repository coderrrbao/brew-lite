/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Order } from '../generated/prisma/client';
import { PromotionsService } from './promotions.service';

describe('promotionsService', () => {
  let service: PromotionsService;
  const taoDonHang = (total: number): Pick<Order, 'total'> => ({ total });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-04T00:00:00.000Z'));
    service = new PromotionsService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.todo('không liệt kê mã khuyến mãi đã hết hạn');
  /*
  it('không liệt kê mã khuyến mãi đã hết hạn', () => {
    expect(service.findAll().some(({ code }) => code === 'HETHAN')).toBe(false);
  });
  */

  it.todo('ném lỗi khi mã khuyến mãi không tồn tại');
  /*
  it('ném lỗi khi mã khuyến mãi không tồn tại', () => {
    expect(() => service.validate('KHONGTONTAI', taoDonHang(100000))).toThrow(
      NotFoundException,
    );
  });
  */

  it.todo('báo không đủ điều kiện khi đơn chưa đạt giá trị tối thiểu');
  /*
  it('báo không đủ điều kiện khi đơn chưa đạt giá trị tối thiểu', () => {
    expect(service.validate('BREW10', taoDonHang(40000))).toMatchObject({
      valid: false,
      discountAmount: 0,
      totalAfterDiscount: 40000,
    });
  });
  */

  it.todo('xác nhận đơn đủ điều kiện và tính giảm giá phần trăm theo giới hạn tối đa');
  /*
  it('xác nhận đơn đủ điều kiện và tính giảm giá phần trăm theo giới hạn tối đa', () => {
    expect(service.validate('BREW10', taoDonHang(300000))).toMatchObject({
      valid: true,
      promotion: expect.objectContaining({
        code: 'BREW10',
        type: 'PERCENTAGE',
      }),
      discountAmount: 20000,
      totalAfterDiscount: 280000,
    });
  });
  */

  it.todo('không tự thay đổi tổng tiền đơn khi chỉ kiểm tra mã giảm giá');
  /*
  it('không tự thay đổi tổng tiền đơn khi chỉ kiểm tra mã giảm giá', () => {
    const donHang = taoDonHang(300000);

    service.validate('BREW10', donHang);

    expect(donHang.total).toBe(300000);
  });
  */

  it.todo('tính đúng mức giảm cố định và kiểu khuyến mãi');
  /*
  it('tính đúng mức giảm cố định và kiểu khuyến mãi', () => {
    const ketQua = service.validate('CAFE5000', taoDonHang(50000));

    expect(ketQua).toMatchObject({
      valid: true,
      promotion: expect.objectContaining({
        code: 'CAFE5000',
        type: 'FIXED_AMOUNT',
      }),
      discountAmount: 5000,
      totalAfterDiscount: 45000,
    });
    expect(ketQua).toHaveProperty('promotion.type', 'FIXED_AMOUNT');
  });
  */

  it.todo('ném lỗi khi mã khuyến mãi đã hết hạn');
  /*
  it('ném lỗi khi mã khuyến mãi đã hết hạn', () => {
    expect(() => service.validate('HETHAN', taoDonHang(50000))).toThrow(
      BadRequestException,
    );
  });
  */
});
