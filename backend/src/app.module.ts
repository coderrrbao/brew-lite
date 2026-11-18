import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { AuthModule } from "./auth/auth.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { UsersModule } from "./users/users.module";
import { ToppingsModule } from "./toppings/toppings.module";
import { SizesModule } from "./sizes/sizes.module";

@Module({
  imports: [
    PrismaModule,
    ProductsModule,
    AuthModule,
    OrdersModule,
    PaymentsModule,
    PromotionsModule,
    UsersModule,
    ToppingsModule,
    SizesModule
  ],
})
export class AppModule {}
