import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import type { AuthenticatedRequest, AuthUser } from './auth-user';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Thiếu Bearer token');
    }

    let payload: AuthUser;
    try {
      payload = await this.jwt.verifyAsync<AuthUser>(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token đã hết hạn');
      }
      throw new UnauthorizedException('Token không hợp lệ');
    }

    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    request.user = payload;
    return true;
  }
}