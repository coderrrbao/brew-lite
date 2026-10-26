import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @HttpCode(200)
  pay(@Body() dto: CreatePaymentDto) {
    return this.payments.pay(dto);
  }
}
