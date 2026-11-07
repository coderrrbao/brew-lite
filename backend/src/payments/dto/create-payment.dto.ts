import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}

export class PayOrderDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsBoolean()
  success: boolean;
}
