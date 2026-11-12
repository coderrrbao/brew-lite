import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto, PayOrderDto } from "./dto/create-payment.dto";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  create(
    @Headers("idempotency-key") idempotencyKey: string,
    @Body() body: CreatePaymentDto,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException("Idempotency-Key header is required");
    }
    return this.payments.create({ ...body, idempotencyKey });
  }

  @Post(":id/confirm")
  confirm(
    @Headers("idempotency-key") idempotencyKey: string,
    @Body() body: PayOrderDto,
  ) {
    return this.payments.pay({
      idempotencyKey: idempotencyKey,
      success: body.success,
    });
  }
}
