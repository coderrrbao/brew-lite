import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @IsOptional()
  @IsIn(["wallet", "card", "momo", "mock"])
  method?: string;
}

export class PayOrderDto {
  @IsString()
  method?: string;

  @IsString()
  orderId: string;

  @IsUUID()
  idempotencyKey: string;

  @IsBoolean()
  success: boolean;
}
