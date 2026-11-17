import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { UsersModule } from "../users/users.module";
import { OrdersModule } from "../orders/orders.module";
import { ProductsModule } from "../products/products.module";

@Module({
  imports: [UsersModule, OrdersModule,ProductsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
