import { Injectable } from '@nestjs/common';
import { MockUser } from '../common/types';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  // TODO: hash password (bcrypt), persist via Prisma, sign real JWT (@nestjs/jwt)
  register(dto: RegisterDto) {
    return this.issue(dto.email, dto.name);
  }

  login(dto: LoginDto) {
    return this.issue(dto.email);
  }

  private issue(email: string, name?: string) {
    const user: MockUser = {
      id: 'u_1',
      name: name || email.split('@')[0],
      email,
      points: 0,
    };
    return { accessToken: 'mock.jwt.token', user };
  }
}
