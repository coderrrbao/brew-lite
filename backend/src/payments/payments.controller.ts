import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
// import { JwtAuthGuard } from "../auth/jwt-auth.guard"; // đúng đường dẫn guard của bạn

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  pay(
    @Headers("idempotency-key") idempotencyKey: string,
    @Body() body: CreatePaymentDto,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException("Idempotency-Key header is required");
    }
    // success do server/mock gateway quyết định, không nhận từ client
    return this.payments.pay({
      orderId: body.orderId,
      method: body.method,
      idempotencyKey,
      success: true,
    });
  }
}