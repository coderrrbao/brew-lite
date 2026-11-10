import { IsBoolean, IsNotEmpty, IsString, IsUUID } from "class-validator";

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
  method: string;

  @IsString()
  orderId: string;

  @IsUUID()
  idempotencyKey: string;

  @IsBoolean()
  success: boolean;
}
