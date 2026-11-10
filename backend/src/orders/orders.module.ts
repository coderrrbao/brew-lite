import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffGuard } from '../auth/staff.guard';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService, JwtAuthGuard, StaffGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
