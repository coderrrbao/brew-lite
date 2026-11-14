import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersController } from '../users/users.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshTokensService } from './refresh-tokens.service';

@Module({
  imports: [
    UsersModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET chưa được cấu hình");

        return {
          secret,
<<<<<<< HEAD
          signOptions: { expiresIn: '30m' },
=======
          signOptions: { expiresIn: "1h" },
>>>>>>> 2dab2426794bd491355e75dc0c2b80c02aff0eb3
        };
      },
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [AuthService, JwtAuthGuard, RefreshTokensService],
  exports: [JwtModule],
})
export class AuthModule {}