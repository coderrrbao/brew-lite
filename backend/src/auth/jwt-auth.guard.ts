import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from './auth-user';

type AuthenticatedRequest = {
  headers: { authorization?: string };
  user?: AuthUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    try {
      const payload = await this.jwt.verifyAsync<AuthUser>(token);
      if (!payload.sub || !payload.email || !payload.role) {
        throw new UnauthorizedException('Invalid access token');
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
