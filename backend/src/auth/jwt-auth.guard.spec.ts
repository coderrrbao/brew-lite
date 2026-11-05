import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

const ctx = (authorization?: string) => {
  const req: any = { headers: { authorization } };
  return {
    req,
    context: {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext,
  };
};

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: 'test-secret-at-least-32-bytes-long!!' });
  const guard = new JwtAuthGuard(jwt);

  it('từ chối khi thiếu header', async () => {
    await expect(guard.canActivate(ctx().context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('từ chối token sai', async () => {
    await expect(guard.canActivate(ctx('Bearer abc').context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('từ chối token hết hạn', async () => {
    const token = await jwt.signAsync({ sub: '1', email: 'a@a.com', role: 'CUSTOMER' }, { expiresIn: '-1s' });
    await expect(guard.canActivate(ctx(`Bearer ${token}`).context)).rejects.toThrow('Token đã hết hạn');
  });

  it('cho qua token hợp lệ và gắn user', async () => {
    const token = await jwt.signAsync({ sub: '1', email: 'a@a.com', role: 'CUSTOMER' });
    const { req, context } = ctx(`Bearer ${token}`);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.user.sub).toBe('1');
  });
});