import "dotenv/config";
import process from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import {
  PrismaClient,
  ProductCategory,
  UserRole,
  OrderStatus,
  PaymentStatus,
  PromotionType,
  LoyaltyTransactionType,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL chưa được cấu hình.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Bắt đầu xóa dữ liệu cũ...");
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.voucherUsage.deleteMany();
  await prisma.redeemedVoucher.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sizeOption.deleteMany();
  await prisma.topping.deleteMany();

  console.log("📏 Đang tạo Kích cỡ (Sizes)...");
  await prisma.sizeOption.createMany({
    data: [
      { value: "S", label: "Nhỏ (S)", priceAdd: 0 },
      { value: "M", label: "Vừa (M)", priceAdd: 5000 },
      { value: "L", label: "Lớn (L)", priceAdd: 10000 },
    ],
  });

  console.log("🧋 Đang tạo Topping...");
  await prisma.topping.createMany({
    data: [
      { id: "pearl", label: "Trân châu đen", price: 5000, active: true },
      { id: "white-pearl", label: "Trân châu trắng", price: 6000, active: true },
      { id: "grass-jelly", label: "Sương sáo", price: 5000, active: true },
      { id: "cheese-foam", label: "Kem Cheese", price: 10000, active: true },
      {
        id: "espresso-shot",
        label: "Thêm 1 shot Espresso",
        price: 12000,
        active: true,
      },
    ],
  });

  console.log("📦 Đang tạo Sản phẩm...");
  const imgCfBlack =
    "https://plus.unsplash.com/premium_photo-1733317435318-531c85f0f00a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D";
  const imgCfMilk =
    "https://images.unsplash.com/photo-1652284916898-b46f3d32e76b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D";
  const imgMatcha =
    "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D";

  await prisma.product.createMany({
    data: [
      {
        id: "prod-cf-black",
        name: "Cà Phê Đen Đá",
        description: "Cà phê đậm vị truyền thống pha phin",
        price: 25000,
        imageUrl: imgCfBlack,
        stock: 100,
        category: ProductCategory.hot,
        popular: true,
        active: true,
      },
      {
        id: "prod-cf-milk",
        name: "Cà Phê Sữa Đá",
        description: "Cà phê phin kết hợp sữa đặc ngọt béo",
        price: 29000,
        imageUrl: imgCfMilk,
        stock: 150,
        category: ProductCategory.cold,
        popular: true,
        active: true,
      },
      {
        id: "prod-matcha-latte",
        name: "Matcha Latte Thượng Hạng",
        description: "Matcha trà xanh Nhật Bản pha sữa tươi thơm ngon",
        price: 45000,
        imageUrl: imgMatcha,
        stock: 80,
        category: ProductCategory.specialty,
        popular: true,
        active: true,
      },
      {
        id: "prod-peach-tea",
        name: "Trà Đào Cam Sả",
        description: "Trà đào thanh mát kết hợp vị cam sả giải nhiệt",
        price: 39000,
        imageUrl:
          "https://images.unsplash.com/photo-1731047005879-f0a56f73fd8d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        stock: 120,
        category: ProductCategory.cold,
        popular: false,
        active: true,
      },
      {
        id: "prod-espresso",
        name: "Espresso Single Shot",
        description: "Đậm đà chiết xuất từ hạt Arabica nguyên chất",
        price: 32000,
        imageUrl:
          "https://images.unsplash.com/photo-1705952285570-113e76f63fb0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        stock: 50,
        category: ProductCategory.hot,
        popular: false,
        active: true,
      },
    ],
  });

  console.log("👤 Đang tạo Người dùng...");
  const passwordHash = await hash("matkhau123", 10);

  const user1 = await prisma.user.create({
    data: {
      name: "Nguyễn Hoài Bảo",
      email: "bao.nguyen@example.com",
      passwordHash,
      role: UserRole.CUSTOMER,
      loyaltyPoints: 150,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Trần Thị Thu",
      email: "thu.tran@example.com",
      passwordHash,
      role: UserRole.CUSTOMER,
      loyaltyPoints: 40,
    },
  });

  await prisma.user.create({
    data: {
      name: "Nhân viên Quầy",
      email: "staff@example.com",
      passwordHash,
      role: UserRole.STAFF,
    },
  });

  console.log("🎟️ Đang tạo Khuyến mãi...");
  await prisma.promotion.createMany({
    data: [
      {
        code: "WELCOME10",
        description: "Giảm 10% cho đơn hàng từ 30k",
        type: PromotionType.PERCENTAGE,
        value: 10,
        minimumOrderAmount: 30000,
        maximumDiscountAmount: 20000,
        pointCost: 0,
        active: true,
      },
      {
        code: "BREW20K",
        description: "Giảm 20k cho đơn từ 100k",
        type: PromotionType.FIXED_AMOUNT,
        value: 20000,
        minimumOrderAmount: 100000,
        pointCost: 0,
        active: true,
      },
      {
        code: "USED15K",
        description: "Mã ưu đãi 15k (user1 đã dùng)",
        type: PromotionType.FIXED_AMOUNT,
        value: 15000,
        minimumOrderAmount: 50000,
        pointCost: 0,
        active: true,
      },
      {
        code: "VIP30K",
        description: "Giảm 30k cho đơn từ 70k",
        type: PromotionType.FIXED_AMOUNT,
        value: 30000,
        minimumOrderAmount: 70000,
        pointCost: 50,
        active: true,
      },
      {
        code: "VIP50K",
        description: "Giảm 50k cho đơn từ 150k",
        type: PromotionType.FIXED_AMOUNT,
        value: 50000,
        minimumOrderAmount: 150000,
        pointCost: 100,
        active: true,
      },
      {
        code: "MEMBER20",
        description: "Giảm 20% tối đa 40k (user1 đã đổi & đã dùng)",
        type: PromotionType.PERCENTAGE,
        value: 20,
        minimumOrderAmount: 60000,
        maximumDiscountAmount: 40000,
        pointCost: 80,
        active: true,
      },
    ],
  });

  console.log("🎫 Đang tạo Ví mã đã đổi (RedeemedVoucher)...");
  await prisma.redeemedVoucher.createMany({
    data: [
      {
        userId: user1.id,
        promotionCode: "VIP30K",
        pointsSpent: 50,
      },
      {
        userId: user1.id,
        promotionCode: "MEMBER20",
        pointsSpent: 80,
      },
    ],
  });

  console.log("🛒 Đang tạo Đơn hàng & Lịch sử dùng mã...");
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      promotionCode: "MEMBER20",
      pointsSpent: 0,
      subTotal: 103000,
      discountAmount: 20600,
      total: 82400,
      status: OrderStatus.COMPLETED,
      items: {
        create: [
          {
            productId: "prod-cf-milk",
            name: "Cà Phê Sữa Đá",
            imageUrl: imgCfMilk,
            size: "L",
            toppings: ["pearl", "grass-jelly"],
            qty: 2,
            unitPrice: 29000,
            lineTotal: 78000,
          },
          {
            productId: "prod-cf-black",
            name: "Cà Phê Đen Đá",
            imageUrl: imgCfBlack,
            size: "S",
            toppings: [],
            qty: 1,
            unitPrice: 25000,
            lineTotal: 25000,
          },
        ],
      },
      payments: {
        create: {
          idempotencyKey: "PAY-KEY-001",
          amount: 82400,
          method: "MOMO",
          status: PaymentStatus.PAID,
        },
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: user1.id,
      promotionCode: "USED15K",
      pointsSpent: 0,
      subTotal: 64000,
      discountAmount: 15000,
      total: 49000,
      status: OrderStatus.COMPLETED,
      items: {
        create: [
          {
            productId: "prod-peach-tea",
            name: "Trà Đào Cam Sả",
            imageUrl:
              "https://images.unsplash.com/photo-1731047005879-f0a56f73fd8d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
            size: "L",
            toppings: ["white-pearl"],
            qty: 1,
            unitPrice: 39000,
            lineTotal: 64000,
          },
        ],
      },
      payments: {
        create: {
          idempotencyKey: "PAY-KEY-002",
          amount: 49000,
          method: "ZALOPAY",
          status: PaymentStatus.PAID,
        },
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      userId: user2.id,
      subTotal: 55000,
      total: 55000,
      status: OrderStatus.PREPARING,
      items: {
        create: [
          {
            productId: "prod-matcha-latte",
            name: "Matcha Latte Thượng Hạng",
            imageUrl: imgMatcha,
            size: "S",
            toppings: ["cheese-foam"],
            qty: 1,
            unitPrice: 45000,
            lineTotal: 55000,
          },
        ],
      },
      payments: {
        create: {
          idempotencyKey: "PAY-KEY-003",
          amount: 55000,
          method: "BANK_TRANSFER",
          status: PaymentStatus.PAID,
        },
      },
    },
  });

  await prisma.voucherUsage.createMany({
    data: [
      {
        userId: user1.id,
        promotionCode: "MEMBER20",
        orderId: order1.id,
        discountAmount: 20600,
      },
      {
        userId: user1.id,
        promotionCode: "USED15K",
        orderId: order2.id,
        discountAmount: 15000,
      },
    ],
  });

  console.log("💎 Đang tạo Nhật ký biến động điểm thưởng (LoyaltyTransaction)...");
  await prisma.loyaltyTransaction.createMany({
    data: [
      {
        userId: user1.id,
        promotionCode: "VIP30K",
        type: LoyaltyTransactionType.REDEEM,
        points: -50,
      },
      {
        userId: user1.id,
        promotionCode: "MEMBER20",
        type: LoyaltyTransactionType.REDEEM,
        points: -80,
      },
      {
        userId: user1.id,
        orderId: order1.id,
        type: LoyaltyTransactionType.EARN,
        points: 80,
      },
      {
        userId: user1.id,
        orderId: order2.id,
        type: LoyaltyTransactionType.EARN,
        points: 50,
      },
      {
        userId: user2.id,
        orderId: order3.id,
        type: LoyaltyTransactionType.EARN,
        points: 55,
      },
    ],
  });

  console.log("✅ Chèn dữ liệu mẫu thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });