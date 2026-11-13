import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StaffGuard } from '../auth/staff.guard';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports: [AuthModule, ProductsModule, PromotionsModule],
  controllers: [OrdersController],
  providers: [OrdersService, JwtAuthGuard, StaffGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
