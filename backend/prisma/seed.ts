import 'dotenv/config';
import process from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ProductCategory, OrderStatus, PromotionType } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL chưa được cấu hình.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Bắt đầu xóa dữ liệu cũ...');
  // Xóa theo thứ tự phụ thuộc để tránh xung đột Foreign Key
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.promotion.deleteMany();

  console.log('📦 Đang tạo Sản phẩm...');
  await prisma.product.createMany({
    data: [
      {
        id: 'prod-cf-black',
        name: 'Cà Phê Đen Đá',
        description: 'Cà phê đậm vị truyền thống pha phin',
        price: 25000,
        imageUrl: '/images/products/black-coffee.jpg',
        stock: 100,
        category: ProductCategory.hot,
        popular: true,
        active: true,
      },
      {
        id: 'prod-cf-milk',
        name: 'Cà Phê Sữa Đá',
        description: 'Cà phê phin kết hợp sữa đặc ngọt béo',
        price: 29000,
        imageUrl: '/images/products/milk-coffee.jpg',
        stock: 150,
        category: ProductCategory.cold,
        popular: true,
        active: true,
      },
      {
        id: 'prod-matcha-latte',
        name: 'Matcha Latte Thượng Hạng',
        description: 'Matcha trà xanh Nhật Bản pha sữa tươi thơm ngon',
        price: 45000,
        imageUrl: '/images/products/matcha-latte.jpg',
        stock: 80,
        category: ProductCategory.specialty,
        popular: true,
        active: true,
      },
      {
        id: 'prod-peach-tea',
        name: 'Trà Đào Cam Sả',
        description: 'Trà đào thanh mát kết hợp vị cam sả giải nhiệt',
        price: 39000,
        imageUrl: '/images/products/peach-tea.jpg',
        stock: 120,
        category: ProductCategory.cold,
        popular: false,
        active: true,
      },
      {
        id: 'prod-espresso',
        name: 'Espresso Single Shot',
        description: 'Đậm đà chiết xuất từ hạt Arabica nguyên chất',
        price: 32000,
        imageUrl: '/images/products/espresso.jpg',
        stock: 50,
        category: ProductCategory.hot,
        popular: false,
        active: true,
      },
    ],
  });

  console.log('👤 Đang tạo Nguời dùng...');
  const user1 = await prisma.user.create({
    data: {
      name: 'Nguyễn Hoài Bảo',
      email: 'bao.nguyen@example.com',
      passwordHash: '$2b$10$e8p2U4.qS8s0d2E3T4Y5U6u7i8o9p0a1b2c3d4e5f6g7h8i9j0k1l', // Mã hóa giả lập
      loyaltyPoints: 120,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Trần Thị Thu',
      email: 'thu.tran@example.com',
      passwordHash: '$2b$10$e8p2U4.qS8s0d2E3T4Y5U6u7i8o9p0a1b2c3d4e5f6g7h8i9j0k1l',
      loyaltyPoints: 50,
    },
  });

  console.log('🎟️ Đang tạo Khuyến mãi...');
  await prisma.promotion.createMany({
    data: [
      {
        code: 'WELCOME10',
        description: 'Giảm 10% cho đơn hàng đầu tiên',
        type: PromotionType.PERCENTAGE,
        value: 10,
        minimumOrderAmount: 30000,
        maximumDiscountAmount: 20000,
        active: true,
      },
      {
        code: 'BREW20K',
        description: 'Giảm 20k cho đơn từ 100k',
        type: PromotionType.FIXED_AMOUNT,
        value: 20000,
        minimumOrderAmount: 100000,
        active: true,
      },
    ],
  });

  console.log('🛒 Đang tạo Đơn hàng & Chi tiết...');
  // Đơn 1: Đã hoàn thành
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      total: 83000,
      status: OrderStatus.COMPLETED,
      items: {
        create: [
          {
            productId: 'prod-cf-milk',
            name: 'Cà Phê Sữa Đá',
            imageUrl: '/images/products/milk-coffee.jpg',
            size: 'L',
            toppings: ['Trân châu đen', 'Sương sáo'],
            qty: 2,
            unitPrice: 29000,
            lineTotal: 58000,
          },
          {
            productId: 'prod-cf-black',
            name: 'Cà Phê Đen Đá',
            imageUrl: '/images/products/black-coffee.jpg',
            size: 'M',
            toppings: [],
            qty: 1,
            unitPrice: 25000,
            lineTotal: 25000,
          },
        ],
      },
      payments: {
        create: {
          idempotencyKey: 'PAY-KEY-001',
          amount: 83000,
          method: 'MOMO',
        },
      },
    },
  });

  // Đơn 2: Đang chuẩn bị
  await prisma.order.create({
    data: {
      userId: user2.id,
      total: 45000,
      status: OrderStatus.PREPARING,
      items: {
        create: [
          {
            productId: 'prod-matcha-latte',
            name: 'Matcha Latte Thượng Hạng',
            imageUrl: '/images/products/matcha-latte.jpg',
            size: 'M',
            toppings: ['Kem Cheese'],
            qty: 1,
            unitPrice: 45000,
            lineTotal: 45000,
          },
        ],
      },
      payments: {
        create: {
          idempotencyKey: 'PAY-KEY-002',
          amount: 45000,
          method: 'BANK_TRANSFER',
        },
      },
    },
  });

  console.log('✅ Chèn dữ liệu mẫu thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });