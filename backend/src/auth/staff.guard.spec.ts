import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { StaffGuard } from './staff.guard';

const ctx = (user?: { role: string }) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('StaffGuard', () => {
  const guard = new StaffGuard();

  it('cho qua khi role là STAFF', () => {
    expect(guard.canActivate(ctx({ role: 'STAFF' }))).toBe(true);
  });

  it('từ chối CUSTOMER bằng ForbiddenException', () => {
    expect(() => guard.canActivate(ctx({ role: 'CUSTOMER' }))).toThrow(
      ForbiddenException,
    );
  });

  it('từ chối khi chưa có user trên request', () => {
    expect(() => guard.canActivate(ctx(undefined))).toThrow(
      ForbiddenException,
    );
  });
});