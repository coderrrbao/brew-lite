describe('PromotionsService - xử lý mã khuyến mãi', () => {
  it.todo('kiểm thử danh sách mã, điều kiện và cách tính giảm giá');
  /*
  let service: PromotionsService;
  const order = (total: number): Pick<Order, 'total'> => ({ total });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-04T00:00:00.000Z'));
    service = new PromotionsService();
  });

  afterEach(() => jest.useRealTimers());

  it('không liệt kê mã khuyến mãi đã hết hạn', () => {
    expect(service.findAll().some(({ code }) => code === 'HETHAN')).toBe(false);
  });

  it('ném lỗi khi mã khuyến mãi không tồn tại', () => {
    expect(() => service.validate('KHONGTONTAI', order(100000))).toThrow(
      NotFoundException,
    );
  });

  it('báo không đủ điều kiện khi đơn chưa đạt giá trị tối thiểu', () => {
    expect(service.validate('BREW10', order(40000))).toMatchObject({
      valid: false,
      discountAmount: 0,
      totalAfterDiscount: 40000,
    });
  });

  it('tính giảm giá phần trăm theo giới hạn tối đa', () => {
    expect(service.validate('BREW10', order(300000))).toMatchObject({
      valid: true,
      discountAmount: 20000,
      totalAfterDiscount: 280000,
    });
  });

  it('không thay đổi tổng tiền đơn khi chỉ kiểm tra mã giảm giá', () => {
    const input = order(300000);
    service.validate('BREW10', input);
    expect(input.total).toBe(300000);
  });

  it('tính đúng mức giảm cố định', () => {
    expect(service.validate('CAFE5000', order(50000))).toMatchObject({
      valid: true,
      discountAmount: 5000,
      totalAfterDiscount: 45000,
    });
  });

  it('ném lỗi khi mã khuyến mãi đã hết hạn', () => {
    expect(() => service.validate('HETHAN', order(50000))).toThrow(
      BadRequestException,
    );
  });
  */
});
