// src/orders/orders.service.spec.ts
import { ConflictException, NotFoundException } from "@nestjs/common";
import type { OrderStatus } from "../generated/prisma/client";
import { OrdersService } from "./orders.service";

type Transition = [OrderStatus, OrderStatus];

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PREPARING",
  "READY",
  "COMPLETED",
  "PAYMENT_FAILED",
  "CANCELLED",
];

// Các chuyển trạng thái được phép (khớp với allowedOrderTransitions)
const VALID_TRANSITIONS: Transition[] = [
  ["PENDING", "PAID"], // Chờ thanh toán → Đã thanh toán
  ["PENDING", "PAYMENT_FAILED"], // Chờ thanh toán → Thanh toán thất bại
  ["PENDING", "CANCELLED"], // Hủy đơn đang chờ thanh toán
  ["PAID", "PREPARING"], // Đã thanh toán → Đang chuẩn bị
  ["PAID", "CANCELLED"], // Hủy đơn đã thanh toán
  ["PREPARING", "READY"], // Đang chuẩn bị → Sẵn sàng
  ["READY", "COMPLETED"], // Sẵn sàng → Hoàn thành
  ["PAYMENT_FAILED", "PENDING"], // Thử lại thanh toán
  ["PAYMENT_FAILED", "PAID"], // Thử lại và thanh toán thành công
  ["PAYMENT_FAILED", "CANCELLED"], // Hủy đơn sau khi thanh toán thất bại
];

const isValid = (from: OrderStatus, to: OrderStatus) =>
  VALID_TRANSITIONS.some(([f, t]) => f === from && t === to);

// Mọi cặp còn lại (bao gồm cả giữ nguyên trạng thái) đều phải bị từ chối
const INVALID_TRANSITIONS: Transition[] = ALL_STATUSES.flatMap((from) =>
  ALL_STATUSES.filter((to) => !isValid(from, to)).map(
    (to): Transition => [from, to],
  ),
);

function createPrismaMock() {
  return {
    order: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      updateMany: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
    product: {
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

describe("OrdersService", () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: OrdersService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new OrdersService(prisma as never, {} as never, {} as never);
  });

  // 1. KIỂM TRA MÁY TRẠNG THÁI

  describe("assertTransition", () => {
    it.each(VALID_TRANSITIONS)("cho phép %s → %s", (from, to) => {
      expect(() => service.assertTransition(from, to)).not.toThrow();
    });

    it.each(INVALID_TRANSITIONS)("từ chối %s → %s", (from, to) => {
      expect(() => service.assertTransition(from, to)).toThrow(
        ConflictException,
      );
    });

    it("báo lỗi kèm trạng thái cũ và mới", () => {
      expect(() => service.assertTransition("PAID", "COMPLETED")).toThrow(
        "Cannot change order status from PAID to COMPLETED",
      );
    });

    it("đơn COMPLETED và CANCELLED là trạng thái cuối", () => {
      for (const final of ["COMPLETED", "CANCELLED"] as OrderStatus[]) {
        for (const to of ALL_STATUSES) {
          expect(() => service.assertTransition(final, to)).toThrow(
            ConflictException,
          );
        }
      }
    });
  });

  // 2. STAFF CẬP NHẬT TRẠNG THÁI

  describe("updateStatus (staff)", () => {
    it("ném NotFoundException khi đơn không tồn tại", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus("o1", "PREPARING")).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it("từ chối chuyển trạng thái không hợp lệ và không ghi DB", async () => {
      prisma.order.findUnique.mockResolvedValue({ id: "o1", status: "PAID" });

      await expect(service.updateStatus("o1", "COMPLETED")).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it("cập nhật PAID → PREPARING với điều kiện khóa theo trạng thái cũ", async () => {
      const updatedOrder = { id: "o1", status: "PREPARING", items: [] };
      prisma.order.findUnique.mockResolvedValue({ id: "o1", status: "PAID" });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.findUniqueOrThrow.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus("o1", "PREPARING");

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: "o1", status: "PAID" },
        data: { status: "PREPARING" },
      });
      expect(result).toBe(updatedOrder);
    });

    it("ném ConflictException khi trạng thái bị đổi bởi request khác", async () => {
      prisma.order.findUnique.mockResolvedValue({ id: "o1", status: "PAID" });
      prisma.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.updateStatus("o1", "PREPARING")).rejects.toThrow(
        "Order status changed concurrently",
      );
      expect(prisma.order.findUniqueOrThrow).not.toHaveBeenCalled();
    });
  });

  // 3. KHÁCH HÀNG THANH TOÁN LẠI / HỦY ĐƠN

  describe("updateStatusByUser (khách hàng)", () => {
    const USER_ID = "u1";

    it("ném NotFoundException khi đơn không tồn tại", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatusByUser("o1", "CANCELLED", USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it("từ chối khi đơn thuộc về người dùng khác", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: "someone-else",
        status: "PENDING",
      });

      await expect(
        service.updateStatusByUser("o1", "CANCELLED", USER_ID),
      ).rejects.toThrow("You do not have permission to modify this order");
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it.each(["PAID", "PREPARING", "READY", "COMPLETED", "PAYMENT_FAILED"] as const)(
      "khách hàng không được tự đặt trạng thái %s",
      async (status) => {
        prisma.order.findUnique.mockResolvedValue({
          id: "o1",
          userId: USER_ID,
          status: "PAYMENT_FAILED",
        });

        await expect(
          service.updateStatusByUser("o1", status, USER_ID),
        ).rejects.toThrow("Customers can only retry or cancel their orders");
        expect(prisma.order.updateMany).not.toHaveBeenCalled();
      },
    );

    it("từ chối hủy đơn đã COMPLETED", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: USER_ID,
        status: "COMPLETED",
      });

      await expect(
        service.updateStatusByUser("o1", "CANCELLED", USER_ID),
      ).rejects.toThrow(ConflictException);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it("thanh toán lại: PAYMENT_FAILED → PENDING, không hoàn kho", async () => {
      const updatedOrder = { id: "o1", status: "PENDING", items: [] };
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: USER_ID,
        status: "PAYMENT_FAILED",
      });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.findUniqueOrThrow.mockResolvedValue(updatedOrder);

      const result = await service.updateStatusByUser("o1", "PENDING", USER_ID);

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: "o1", status: "PAYMENT_FAILED" },
        data: { status: "PENDING" },
      });
      expect(prisma.orderItem.findMany).not.toHaveBeenCalled();
      expect(prisma.product.update).not.toHaveBeenCalled();
      expect(result).toBe(updatedOrder);
    });

    it("hủy đơn: chuyển CANCELLED và hoàn lại tồn kho từng sản phẩm", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: USER_ID,
        status: "PENDING",
      });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.orderItem.findMany.mockResolvedValue([
        { productId: "p1", qty: 2 },
        { productId: "p2", qty: 1 },
      ]);
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        id: "o1",
        status: "CANCELLED",
        items: [],
      });

      await service.updateStatusByUser("o1", "CANCELLED", USER_ID);

      expect(prisma.orderItem.findMany).toHaveBeenCalledWith({
        where: { orderId: "o1" },
      });
      expect(prisma.product.update).toHaveBeenCalledTimes(2);
      expect(prisma.product.update).toHaveBeenNthCalledWith(1, {
        where: { id: "p1" },
        data: { stock: { increment: 2 } },
      });
      expect(prisma.product.update).toHaveBeenNthCalledWith(2, {
        where: { id: "p2" },
        data: { stock: { increment: 1 } },
      });
    });

    it("hủy đơn đã thanh toán (PAID → CANCELLED) cũng hoàn kho", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: USER_ID,
        status: "PAID",
      });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.orderItem.findMany.mockResolvedValue([{ productId: "p1", qty: 3 }]);
      prisma.order.findUniqueOrThrow.mockResolvedValue({ id: "o1" });

      await service.updateStatusByUser("o1", "CANCELLED", USER_ID);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { stock: { increment: 3 } },
      });
    });

    it("lỗi khi hoàn kho một sản phẩm không làm hỏng việc hủy đơn", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: USER_ID,
        status: "PENDING",
      });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.orderItem.findMany.mockResolvedValue([
        { productId: "p1", qty: 1 },
        { productId: "p2", qty: 1 },
      ]);
      prisma.product.update
        .mockRejectedValueOnce(new Error("product deleted"))
        .mockResolvedValueOnce({});
      prisma.order.findUniqueOrThrow.mockResolvedValue({ id: "o1" });

      await expect(
        service.updateStatusByUser("o1", "CANCELLED", USER_ID),
      ).resolves.toBeDefined();
      expect(prisma.product.update).toHaveBeenCalledTimes(2);
    });

    it("không hoàn kho khi trạng thái bị đổi bởi request khác", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "o1",
        userId: USER_ID,
        status: "PENDING",
      });
      prisma.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateStatusByUser("o1", "CANCELLED", USER_ID),
      ).rejects.toThrow("Order status changed concurrently");
      expect(prisma.orderItem.findMany).not.toHaveBeenCalled();
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });
});