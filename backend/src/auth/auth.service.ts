import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '../generated/prisma/client';
import { LoginDto, RegisterDto } from './dto/auth.dto';

type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const passwordHash = await hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        loyaltyPoints: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.createAuthResponse(user);
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        loyaltyPoints: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const { passwordHash: _passwordHash, ...publicUser } = user;
    return this.createAuthResponse(publicUser);
  }

  private async createAuthResponse(
    user: PublicUser,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    return { accessToken, user };
  }
}
