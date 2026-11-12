import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string
}

export class PayOrderDto{
  @IsBoolean()
  success: boolean

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string
}
