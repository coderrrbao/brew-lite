import {
  ConflictException, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { compare, hash, hashSync } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '../generated/prisma/client';
import { LoginDto, RegisterDto } from './dto/auth.dto';

//
const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = hashSync('dummy-password', BCRYPT_ROUNDS);

type PublicUser = Omit<User, 'passwordHash'>;
export type AuthResponse = { accessToken: string; user: PublicUser };

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  loyaltyPoints: true,
  createdAt: true,
  updatedAt: true,
} as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email, name: dto.name, passwordHash },
        select: PUBLIC_USER_SELECT,
      });
      return this.createAuthResponse(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { ...PUBLIC_USER_SELECT, passwordHash: true },
    });

    const isValid = await compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !isValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const { passwordHash: _ignored, ...publicUser } = user;
    return this.createAuthResponse(publicUser);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');
    return user;
  }

  private async createAuthResponse(user: PublicUser): Promise<AuthResponse> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken, user };
  }
}