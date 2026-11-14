import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { UsersModule } from "../users/users.module";
import { OrdersModule } from "../orders/orders.module";

@Module({
  imports: [UsersModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
