import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";

export class CreatePaymentBodyDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @IsIn(["zalopay", "card", "momo", "visa"])
  method?: string;
}

export interface CreatePaymentDto {
  orderId: string;
  idempotencyKey: string;
  method?: string;
}

export class PayOrderDto {
  @IsString()
  idempotencyKey: string;

  @IsBoolean()
  success: boolean;
}
