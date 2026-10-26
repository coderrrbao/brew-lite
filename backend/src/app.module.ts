import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PromotionsModule } from './promotions/promotions.module';

@Module({
  imports: [ProductsModule, AuthModule, OrdersModule, PaymentsModule, PromotionsModule],
})
export class AppModule {}
