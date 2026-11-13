import { Module } from "@nestjs/common";
import { PromotionsController } from "./promotions.controller";
import { PromotionsService } from "./promotions.service";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, OptionalJwtAuthGuard],
  exports: [PromotionsService],
})
export class PromotionsModule {}
