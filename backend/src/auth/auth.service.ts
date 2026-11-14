import {
  ConflictException, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { compare, hash, hashSync } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { UsersService } from '../users/users.service';
import type { UserDto } from '../users/dto/user.dto';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { RefreshTokensService } from './refresh-tokens.service';

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = hashSync('dummy-password', BCRYPT_ROUNDS);
const REFRESH_TTL_SECONDS = 24 * 60 * 7;

type TokenIdentity = Pick<UserDto, 'id' | 'email' | 'role'>;
export type TokenPair = { accessToken: string; refreshToken: string };
export type AuthResponse = TokenPair & { user: UserDto };
type RefreshPayload = {
  sub: string;
  jti: string;
  email: string;
  role: UserDto['role'];
};

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET chưa được cấu hình');
  return secret;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokensService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.users.create({
        email: dto.email,
        name: dto.name,
        passwordHash,
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
    const user = await this.users.findByEmail(dto.email);

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

  async refresh(dto: RefreshDto): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);

    const ok = await this.refreshTokens.consume(payload.jti, dto.refreshToken);
    if (!ok) {
      await this.refreshTokens.revokeAllForUser(payload.sub);
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    return this.issueTokens({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  }

  async logout(dto: RefreshDto): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(dto.refreshToken);
      await this.refreshTokens.consume(payload.jti, dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  private async verifyRefreshToken(token: string): Promise<RefreshPayload> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: getRefreshSecret(),
      });
      if (!payload.sub || !payload.jti || !payload.email || !payload.role) {
        throw new Error('payload thiếu field');
      }
      return payload;
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  private async createAuthResponse(user: UserDto): Promise<AuthResponse> {
    const tokens = await this.issueTokens(user);
    return { ...tokens, user };
  }

  private async issueTokens(identity: TokenIdentity): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync({
      sub: identity.id,
      email: identity.email,
      role: identity.role,
    });

    const tokenId = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: identity.id, email: identity.email, role: identity.role },
      {
        secret: getRefreshSecret(),
        expiresIn: REFRESH_TTL_SECONDS,
        jwtid: tokenId,
      },
    );
    await this.refreshTokens.store({
      id: tokenId,
      userId: identity.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
    });

    return { accessToken, refreshToken };
  }
}