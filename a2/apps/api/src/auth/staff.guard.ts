import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthUser } from './auth-user';

type AuthenticatedRequest = {
  user?: AuthUser;
};

@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user?.role !== 'STAFF') {
      throw new ForbiddenException('Staff role is required');
    }
    return true;
  }
}
