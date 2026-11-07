import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto, PayOrderDto } from "./dto/create-payment.dto";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @HttpCode(200)
  create(@Body() dto: CreatePaymentDto) {
    return this.payments.create(dto);
  }

  @Post("confirm")
  @HttpCode(200)
  pay(@Body() dto: PayOrderDto) {
    return this.payments.pay(dto);
  }
}
