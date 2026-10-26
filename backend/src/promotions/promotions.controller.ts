import { Body, Controller, Get, Post } from '@nestjs/common';
import { ValidatePromotionDto } from './dto/validate-promotion.dto';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  findAll() {
    return this.promotions.findAll();
  }

  @Post('validate')
  validate(@Body() dto: ValidatePromotionDto) {
    return this.promotions.validate(dto.code, dto.subtotal);
  }
}
