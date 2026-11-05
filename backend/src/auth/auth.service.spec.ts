import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import type { User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

describe('authService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let module: TestingModule;

  const ngayTao = new Date('2026-01-01T00:00:00.000Z');
  const nguoiDungCongKhai = {
    id: 'user-1',
    name: 'Nguyen',
    email: 'nguyen@example.com',
    role: 'CUSTOMER' as const,
    loyaltyPoints: 0,
    createdAt: ngayTao,
    updatedAt: ngayTao,
  };
  const nguoiDungCoMatKhau: User = {
    ...nguoiDungCongKhai,
    passwordHash: 'hash-mock',
  };

  const prismaMock = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeAll(() => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'unit-test-only-secret-key-at-least-32-bytes';
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    module = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    authService = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('đăng ký trả về JWT hợp lệ và user không có trường nhạy cảm', async () => {
    prismaMock.user.create.mockResolvedValue(nguoiDungCongKhai);

    const ketQua = await authService.register({
      email: 'nguyen@example.com',
      password: 'matkhau123',
      name: 'Nguyen',
    });
    const payload = await jwtService.verifyAsync(ketQua.accessToken);
    const duLieuTao = prismaMock.user.create.mock.calls[0][0];

    expect(duLieuTao.data.email).toBe('nguyen@example.com');
    expect(duLieuTao.data.passwordHash).not.toBe('matkhau123');
    expect(duLieuTao.select).not.toHaveProperty('passwordHash');
    expect(payload).toEqual(
      expect.objectContaining({
        sub: 'user-1',
        email: 'nguyen@example.com',
        role: 'CUSTOMER',
      }),
    );
    expect(ketQua.user).toEqual(nguoiDungCongKhai);
    expect(ketQua.user).not.toHaveProperty('passwordHash');
    expect(ketQua.user).not.toHaveProperty('password');
  });

  it('đăng nhập trả về JWT hợp lệ và user không có trường nhạy cảm', async () => {
    const passwordHash = await hash('matkhau123', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      ...nguoiDungCoMatKhau,
      passwordHash,
    });

    const ketQua = await authService.login({
      email: 'nguyen@example.com',
      password: 'matkhau123',
    });
    const payload = await jwtService.verifyAsync(ketQua.accessToken);

    expect(payload).toEqual(
      expect.objectContaining({
        sub: 'user-1',
        email: 'nguyen@example.com',
        role: 'CUSTOMER',
      }),
    );
    expect(ketQua.user).toEqual(nguoiDungCongKhai);
    expect(ketQua.user).not.toHaveProperty('passwordHash');
    expect(ketQua.user).not.toHaveProperty('password');
  });

  it('từ chối đăng nhập khi mật khẩu không đúng', async () => {
    const passwordHash = await hash('matkhau-dung', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      ...nguoiDungCoMatKhau,
      passwordHash,
    });

    await expect(
      authService.login({
        email: 'nguyen@example.com',
        password: 'matkhau-sai',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('từ chối đăng nhập khi email không tồn tại', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'khong-ton-tai@example.com',
        password: 'matkhau123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  
  it('đăng ký trùng email trả về ConflictException', async () => {
    prismaMock.user.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      authService.register({
        email: 'nguyen@example.com',
        password: 'matkhau123',
        name: 'Nguyen',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('me trả về user công khai', async () => {
    prismaMock.user.findUnique.mockResolvedValue(nguoiDungCongKhai);
    await expect(authService.me('user-1')).resolves.toEqual(nguoiDungCongKhai);
  });

  it('me ném lỗi khi user không còn tồn tại', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(authService.me('x')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
