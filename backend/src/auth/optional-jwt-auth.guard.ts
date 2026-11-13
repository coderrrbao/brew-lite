import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest, AuthUser } from './auth-user';

/**
 * Tương tự JwtAuthGuard nhưng không bắt buộc:
 * - Có token hợp lệ → gắn req.user
 * - Không có token / token lỗi → req.user = undefined, vẫn cho qua
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) return true;

    try {
      const payload = await this.jwt.verifyAsync<AuthUser>(token);
      if (payload.sub && payload.email && payload.role) {
        request.user = payload;
      }
    } catch {
      // token lỗi / hết hạn → bỏ qua, coi như anonymous
    }

    return true;
  }
}
