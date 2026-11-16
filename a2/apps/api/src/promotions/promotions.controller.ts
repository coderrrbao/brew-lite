import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ValidatePromotionDto } from "./dto/validate-promotion.dto";
import { PromotionsService } from "./promotions.service";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthenticatedRequest } from "../auth/auth-user";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth-user";

@Controller("promotions")
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Req() req: AuthenticatedRequest) {
    return this.promotions.findAll(req.user?.sub);
  }

  @Post("validate")
  @UseGuards(JwtAuthGuard)
  validate(@Body() dto: ValidatePromotionDto, @CurrentUser() user: AuthUser) {
    return this.promotions.validate(
      dto.code,
      { total: dto.subtotal },
      user.sub,
    );
  }
}
