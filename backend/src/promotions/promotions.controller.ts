import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ValidatePromotionDto } from "./dto/validate-promotion.dto";
import { PromotionsService } from "./promotions.service";

@Controller("promotions")
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  findAll(@Query("userId") userId?: string) {
    return this.promotions.findAll(userId);
  }

  @Post("validate")
  validate(@Body() dto: ValidatePromotionDto) {
    return this.promotions.validate(
      dto.code,
      { total: dto.subtotal },
      dto.userId,
    );
  }
}
